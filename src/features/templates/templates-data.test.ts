import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { resetDemoTemplates } from '@/features/templates/template-demo-store'
import { loadTemplateCategories, loadTemplatePage } from '@/features/templates/templates-data'

vi.mock('server-only', () => ({}))

const load = vi.fn()
vi.mock('@/lib/dal', () => ({ load: (path: string, query: unknown) => load(path, query) }))
vi.mock('@/features/catalog/lookups', () => ({ loadActiveUsers: async () => [], loadClients: async () => [] }))

afterEach(() => {
  load.mockReset()
  vi.unstubAllEnvs()
})

describe('modelos em desenvolvimento', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'development')
    resetDemoTemplates()
  })

  it('pagina os modelos de demonstracao filtrados, sem chamar a API', async () => {
    const page = await loadTemplatePage({ category: 'Equipamentos' }, 0, 1)

    expect(page.totalElements).toBe(2)
    expect(page.content).toHaveLength(1)
    expect(page.totalPages).toBe(2)
    expect(load).not.toHaveBeenCalled()
  })

  it('lista as categorias dos modelos de demonstracao', async () => {
    await expect(loadTemplateCategories()).resolves.toContain('Climatização')
  })
})

describe('modelos com a API', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'production')
  })

  it('repassa os filtros com os nomes dos parametros da API', async () => {
    load.mockResolvedValueOnce({ content: [] })
    await loadTemplatePage({ search: 'hvac', status: 'ACTIVE', category: 'Climatização' }, 2)

    expect(load).toHaveBeenCalledWith('/inspection-templates', {
      search: 'hvac',
      status: 'ACTIVE',
      category: 'Climatização',
      page: 2,
      size: 20,
      sort: 'updatedAt,desc',
    })
  })

  it('tira as categorias dos modelos cadastrados, sem repetir', async () => {
    load.mockResolvedValueOnce({ content: [{ category: 'B' }, { category: 'A' }, { category: 'B' }] })
    await expect(loadTemplateCategories()).resolves.toEqual(['A', 'B'])
  })
})
