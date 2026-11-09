import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { demoTemplateId, resetDemoTemplates } from '@/features/templates/template-demo-store'
import { resetDemoDrafts } from '@/features/templates/template-draft-demo-store'
import {
  loadTemplateCategories,
  loadTemplateDetail,
  loadTemplatePage,
  loadTemplateVersions,
} from '@/features/templates/templates-data'

vi.mock('server-only', () => ({}))
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NOT_FOUND')
  },
}))

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

describe('construtor', () => {
  const MACHINES = demoTemplateId(4)

  it('em desenvolvimento junta o modelo ao rascunho e lista as versoes', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'development')
    resetDemoTemplates()
    resetDemoDrafts()

    const detail = await loadTemplateDetail(MACHINES)
    expect(detail.title).toBe('Inspeção de Máquinas Pesadas')
    expect(detail.sections).toHaveLength(3)
    await expect(loadTemplateVersions(MACHINES)).resolves.toHaveLength(2)
    expect(load).not.toHaveBeenCalled()
  })

  it('responde 404 para identificador malformado ou desconhecido', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'development')
    await expect(loadTemplateDetail('nao-e-uuid')).rejects.toThrow('NOT_FOUND')
    await expect(loadTemplateDetail('f0000000-0000-4000-8000-000000000000')).rejects.toThrow('NOT_FOUND')
  })

  it('com a API le o detalhe e as versoes do modelo', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'production')
    load.mockResolvedValue([])

    await loadTemplateDetail(MACHINES)
    await loadTemplateVersions(MACHINES)

    expect(load).toHaveBeenCalledWith(`/inspection-templates/${MACHINES}`, undefined)
    expect(load).toHaveBeenCalledWith(`/inspection-templates/${MACHINES}/versions`, undefined)
  })
})
