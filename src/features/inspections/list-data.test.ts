import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { loadInspectionFilterOptions, loadInspectionPage, paginate } from '@/features/inspections/list-data'
import { filterParams, hasActiveFilters, parseInspectionFilters } from '@/features/inspections/list-filters'
import { DEMO_REVIEW_ID } from '@/features/inspections/review-fixture'

vi.mock('server-only', () => ({}))

const load = vi.fn()
vi.mock('@/lib/dal', () => ({ load: (path: string, query: unknown) => load(path, query) }))
vi.mock('@/features/catalog/lookups', () => ({
  loadActiveUsers: async () => [{ id: 't1', name: 'Técnico Real' }],
  loadClients: async () => [{ id: 'c1', name: 'Cliente Real' }],
}))

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'development')
})

afterEach(() => {
  load.mockReset()
  vi.unstubAllEnvs()
})

describe('filtros da URL', () => {
  it('le os filtros validos e ignora valores desconhecidos', () => {
    expect(
      parseInspectionFilters({ q: 'alpha', status: 'UNDER_REVIEW', priority: 'NORMAL', date: '23/10', overdue: '1' }),
    ).toEqual({
      q: 'alpha',
      status: 'UNDER_REVIEW',
      technicianId: undefined,
      clientId: undefined,
      priority: undefined,
      date: undefined,
      overdue: true,
      review: false,
    })
  })

  it('devolve so o que esta preenchido', () => {
    const filters = parseInspectionFilters({ review: '1' })

    expect(hasActiveFilters(filters)).toBe(true)
    expect(Object.entries(filterParams(filters)).filter(([, value]) => value)).toEqual([['review', '1']])
  })
})

describe('loadInspectionPage na demonstracao', () => {
  it('pagina no tamanho pedido, em ordem de data prevista', async () => {
    const page = await loadInspectionPage({}, 0, 5)

    expect(page.content).toHaveLength(5)
    expect(page.totalElements).toBe(12)
    expect(page.totalPages).toBe(3)
    const dates = page.content.map((item) => item.scheduledFor)
    expect(dates).toEqual([...dates].sort())
    expect(load).not.toHaveBeenCalled()
  })

  it('atalho aguardando revisao traz a inspecao da tela de revisao', async () => {
    const page = await loadInspectionPage({ review: true }, 0)

    expect(page.content.map((item) => item.id)).toEqual([DEMO_REVIEW_ID])
  })

  it('atalho atrasadas traz so quem passou da data e ainda esta com o tecnico', async () => {
    const page = await loadInspectionPage({ overdue: true }, 0)

    expect(page.content.map((item) => item.code).sort()).toEqual(['INS-2023-089', 'INS-2023-092', 'INS-2023-094'])
  })

  it('combina busca sem acento com prioridade', async () => {
    const page = await loadInspectionPage({ q: 'industria', priority: 'HIGH' }, 0)

    expect(page.content.map((item) => item.code)).toEqual(['INS-2023-089'])
  })
})

describe('loadInspectionPage com a API', () => {
  it('envia os filtros como parametros da listagem paginada', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'production')
    load.mockResolvedValue(paginate([], 0, 20))

    await loadInspectionPage({ status: 'SUBMITTED', overdue: true }, 2)

    expect(load).toHaveBeenCalledWith('/inspections', expect.objectContaining({
      status: 'SUBMITTED',
      overdue: '1',
      page: 2,
      size: 20,
      sort: 'scheduledFor,asc',
    }))
  })

  it('tira as opcoes dos seletores do catalogo real', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'production')

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
