import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  loadPublisherNames,
  loadTemplateCategories,
  loadTemplateDetail,
  loadTemplatePage,
  loadTemplateVersion,
  loadTemplateVersions,
} from '@/features/templates/templates-data'

vi.mock('server-only', () => ({}))
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NOT_FOUND')
  },
}))

const load = vi.fn()
const loadIfPermitted = vi.fn()
vi.mock('@/lib/dal', () => ({
  load: (path: string, query: unknown) => load(path, query),
  loadIfPermitted: (path: string) => loadIfPermitted(path),
}))

const MACHINES = 'e0000000-0000-4000-8000-000000000004'
const VERSION = 'e3000000-0000-4000-8000-000000000001'

function pageOf(category: string[], page: number, totalPages: number) {
  return { content: category.map((name) => ({ category: name })), page, size: 100, totalElements: 0, totalPages }
}

afterEach(() => {
  load.mockReset()
  loadIfPermitted.mockReset()
})

describe('listagem', () => {
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
    load.mockResolvedValueOnce(pageOf(['B', 'A', 'B'], 0, 1))

    await expect(loadTemplateCategories()).resolves.toEqual(['A', 'B'])
  })

  it('nao perde as categorias que estao alem dos primeiros 100 modelos', async () => {
    load
      .mockResolvedValueOnce(pageOf(['Elétrica'], 0, 2))
      .mockResolvedValueOnce(pageOf(['Zeladoria'], 1, 2))

    await expect(loadTemplateCategories()).resolves.toEqual(['Elétrica', 'Zeladoria'])
    expect(load).toHaveBeenLastCalledWith(
      '/inspection-templates',
      expect.objectContaining({ page: 1, size: 100, sort: 'category,asc' }),
    )
  })
})

describe('construtor', () => {
  it('le o detalhe e as versoes do modelo', async () => {
    load.mockResolvedValue([])

    await loadTemplateDetail(MACHINES)
    await loadTemplateVersions(MACHINES)

    expect(load).toHaveBeenCalledWith(`/inspection-templates/${MACHINES}`, undefined)
    expect(load).toHaveBeenCalledWith(`/inspection-templates/${MACHINES}/versions`, undefined)
  })

  it('responde 404 para identificador malformado sem chamar a API', async () => {
    await expect(loadTemplateDetail('nao-e-uuid')).rejects.toThrow('NOT_FOUND')
    await expect(loadTemplateVersions('nao-e-uuid')).rejects.toThrow('NOT_FOUND')
    expect(load).not.toHaveBeenCalled()
  })

  it('versao de outro modelo responde 404', async () => {
    load.mockResolvedValueOnce({ id: VERSION, templateId: 'e0000000-0000-4000-8000-000000000009' })

    await expect(loadTemplateVersion(MACHINES, VERSION)).rejects.toThrow('NOT_FOUND')
  })

  it('devolve a versao do proprio modelo', async () => {
    load.mockResolvedValueOnce({ id: VERSION, templateId: MACHINES })

    await expect(loadTemplateVersion(MACHINES, VERSION)).resolves.toMatchObject({ id: VERSION })
    expect(load).toHaveBeenCalledWith(`/inspection-template-versions/${VERSION}`, undefined)
  })
})

describe('loadPublisherNames', () => {
  const ME = 'd0000000-0000-4000-8000-000000000002'
  const OTHER = 'd0000000-0000-4000-8000-000000000003'

  it('usa o nome da sessao para o usuario atual e busca os demais', async () => {
    loadIfPermitted.mockResolvedValueOnce({ id: OTHER, name: 'Carlos' })

    const names = await loadPublisherNames([ME, OTHER, OTHER, null], { id: ME, name: 'Ana' })

    expect([...names]).toEqual([
      [ME, 'Ana'],
      [OTHER, 'Carlos'],
    ])
    expect(loadIfPermitted).toHaveBeenCalledTimes(1)
    expect(loadIfPermitted).toHaveBeenCalledWith(`/users/${OTHER}`)
  })

  it('usuario que nao se consegue ler fica sem nome', async () => {
    loadIfPermitted.mockResolvedValueOnce(null)

    const names = await loadPublisherNames([OTHER], { id: ME, name: 'Ana' })

    expect(names.size).toBe(0)
  })

  it('ignora identificador que nao e UUID', async () => {
    await loadPublisherNames(['abc'], { id: ME, name: 'Ana' })

    expect(loadIfPermitted).not.toHaveBeenCalled()
  })
})
