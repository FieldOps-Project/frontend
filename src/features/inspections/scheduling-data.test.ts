import { afterEach, describe, expect, it, vi } from 'vitest'

import { loadPublishedTemplateVersions } from '@/features/inspections/scheduling-data'

vi.mock('server-only', () => ({}))

const load = vi.fn()

vi.mock('@/lib/dal', () => ({
  load: (path: string, query?: unknown) => load(path, query),
}))

afterEach(() => {
  load.mockReset()
})

describe('loadPublishedTemplateVersions', () => {
  it('lista so as versoes liberadas para novas inspecoes dos modelos ativos', async () => {
    const responses: Record<string, unknown> = {
      '/inspection-templates': {
        content: [
          { id: 't1', title: 'Checklist de geradores', category: 'Geradores' },
          { id: 't2', title: 'Inspeção do local', category: 'Local' },
        ],
      },
      '/inspection-templates/t1/versions': [
        { id: 'v1', versionNumber: 1, activeForNewInspections: false },
        { id: 'v2', versionNumber: 2, activeForNewInspections: true },
      ],
      '/inspection-templates/t2/versions': [{ id: 'v3', versionNumber: 1, activeForNewInspections: true }],
    }
    load.mockImplementation(async (path: string) => responses[path])

    expect(await loadPublishedTemplateVersions()).toEqual([
      { versionId: 'v2', templateTitle: 'Checklist de geradores', category: 'Geradores', versionNumber: 2 },
      { versionId: 'v3', templateTitle: 'Inspeção do local', category: 'Local', versionNumber: 1 },
    ])
    expect(load).toHaveBeenCalledWith('/inspection-templates', { status: 'ACTIVE', size: 100 })
  })

  it('devolve lista vazia quando nao ha modelo ativo', async () => {
    load.mockResolvedValue({ content: [] })

    expect(await loadPublishedTemplateVersions()).toEqual([])
  })
})
