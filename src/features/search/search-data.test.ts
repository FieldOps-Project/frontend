import { afterEach, describe, expect, it, vi } from 'vitest'

import { searchWorkspace } from '@/features/search/search-data'
import { inspectionReference } from '@/lib/domain/inspection'

vi.mock('server-only', () => ({}))

const load = vi.fn()
const loadInspectionPage = vi.fn()

vi.mock('@/lib/dal', () => ({ load: (path: string, query: unknown) => load(path, query) }))
vi.mock('@/features/inspections/list-data', () => ({
  loadInspectionPage: (filters: unknown, page: number, size: number) => loadInspectionPage(filters, page, size),
}))

const EMPTY = { content: [], page: 0, size: 5, totalElements: 0, totalPages: 1, first: true, last: true }
const INSPECTION = {
  id: 'd0000000-0000-4000-8000-000000000504',
  title: 'Inspecao preventiva mensal',
  clientName: 'Industria ABC',
  siteName: 'Fabrica Sorocaba',
}

afterEach(() => {
  load.mockReset()
  loadInspectionPage.mockReset()
})

describe('searchWorkspace', () => {
  it('busca inspecoes pelo filtro search e leva cada resultado ao detalhe', async () => {
    load.mockResolvedValue(EMPTY)
    loadInspectionPage.mockResolvedValue({ ...EMPTY, content: [INSPECTION], totalElements: 7 })

    const [inspections] = await searchWorkspace('preventiva', 'SUPERVISOR')

    expect(loadInspectionPage).toHaveBeenCalledWith({ search: 'preventiva' }, 0, 5)
    expect(inspections).toMatchObject({
      key: 'inspections',
      total: 7,
      moreHref: '/inspections?search=preventiva',
      hits: [
        {
          id: INSPECTION.id,
          title: `${inspectionReference(INSPECTION.id)} · Inspecao preventiva mensal`,
          detail: 'Industria ABC · Fabrica Sorocaba',
          href: `/inspections/${INSPECTION.id}`,
        },
      ],
    })
  })

  it('so inclui usuarios para o administrador', async () => {
    load.mockResolvedValue(EMPTY)
    loadInspectionPage.mockResolvedValue(EMPTY)

    expect((await searchWorkspace('ana', 'SUPERVISOR')).map((group) => group.key)).not.toContain('users')
    expect((await searchWorkspace('ana', 'ADMIN')).map((group) => group.key)).toContain('users')
  })
})
