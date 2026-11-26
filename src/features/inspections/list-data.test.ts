import { afterEach, describe, expect, it, vi } from 'vitest'

import { loadInspectionFilterOptions, loadInspectionPage, paginate } from '@/features/inspections/list-data'
import { apiFilterQuery, filterParams, hasActiveFilters, parseInspectionFilters } from '@/features/inspections/list-filters'

vi.mock('server-only', () => ({}))

const load = vi.fn()
vi.mock('@/lib/dal', () => ({ load: (path: string, query: unknown) => load(path, query) }))
vi.mock('@/features/catalog/lookups', () => ({
  loadActiveUsers: async () => [{ id: 't1', name: 'Técnico Real' }],
  loadClients: async () => [{ id: 'c1', name: 'Cliente Real' }],
}))

afterEach(() => {
  load.mockReset()
})

describe('filtros da URL', () => {
  it('le os filtros validos e ignora valores desconhecidos e o antigo filtro de revisao', () => {
    expect(
      parseInspectionFilters({
        search: 'alpha',
        status: 'UNDER_REVIEW',
        priority: 'NORMAL',
        date: '23/10',
        overdue: '1',
        review: '1',
      }),
    ).toEqual({
      search: 'alpha',
      status: 'UNDER_REVIEW',
      technicianId: undefined,
      clientId: undefined,
      priority: undefined,
      date: undefined,
      overdue: true,
    })
  })

  it('devolve so o que esta preenchido', () => {
    const filters = parseInspectionFilters({ overdue: '1' })

    expect(hasActiveFilters(filters)).toBe(true)
    expect(Object.entries(filterParams(filters)).filter(([, value]) => value)).toEqual([['overdue', '1']])
  })

  it('nao ha filtro ativo sem nada na URL', () => {
    expect(hasActiveFilters(parseInspectionFilters({}))).toBe(false)
  })
})

describe('apiFilterQuery', () => {
  it('traduz os filtros para os parametros que a API entende', () => {
    expect(
      apiFilterQuery({
        search: 'gerador',
        status: 'SUBMITTED',
        technicianId: 't1',
        clientId: 'c1',
        priority: 'HIGH',
        overdue: true,
      }),
    ).toEqual({
      search: 'gerador',
      status: 'SUBMITTED',
      technicianId: 't1',
      clientId: 'c1',
      priority: 'HIGH',
      overdue: 'true',
      scheduledFrom: undefined,
      scheduledTo: undefined,
    })
  })

  it('converte a data em instantes de inicio e fim do dia em Sao Paulo', () => {
    expect(apiFilterQuery({ date: '2026-11-23' })).toMatchObject({
      scheduledFrom: '2026-11-23T00:00:00-03:00',
      scheduledTo: '2026-11-23T23:59:59.999-03:00',
    })
  })
})

describe('loadInspectionPage', () => {
  it('pede a pagina a API com filtros, tamanho e ordem por data prevista', async () => {
    const page = paginate([], 0, 20)
    load.mockResolvedValue(page)

    const result = await loadInspectionPage({ status: 'SUBMITTED', overdue: true, search: 'gerador' }, 2)

    expect(result).toBe(page)
    expect(load).toHaveBeenCalledWith('/inspections', {
      search: 'gerador',
      status: 'SUBMITTED',
      technicianId: undefined,
      clientId: undefined,
      priority: undefined,
      overdue: 'true',
      scheduledFrom: undefined,
      scheduledTo: undefined,
      page: 2,
      size: 20,
      sort: 'scheduledFor,asc',
    })
  })
})

describe('loadInspectionFilterOptions', () => {
  it('tira as opcoes dos seletores do catalogo real', async () => {
    expect(await loadInspectionFilterOptions()).toEqual({
      technicians: [{ value: 't1', label: 'Técnico Real' }],
      clients: [{ value: 'c1', label: 'Cliente Real' }],
    })
  })
})

describe('paginate', () => {
  it('nunca passa da ultima pagina', () => {
    const page = paginate([1, 2, 3], 9, 2)

    expect(page).toMatchObject({ page: 1, content: [3], first: false, last: true, totalPages: 2 })
  })
})
