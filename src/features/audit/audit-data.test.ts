import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { loadAuditFilterOptions, loadAuditPage } from '@/features/audit/audit-data'
import { demoAuditEvents } from '@/features/audit/audit-fixture'
import { parseAuditFilters } from '@/features/audit/audit-filters'
import { DEMO_REVIEW_ID } from '@/features/inspections/review-fixture'

vi.mock('server-only', () => ({}))

const loadOptional = vi.fn()

vi.mock('@/lib/dal', () => ({
  load: vi.fn(),
  loadOptional: (path: string, query: unknown) => loadOptional(path, query),
}))
vi.mock('@/features/catalog/lookups', () => ({ loadActiveUsers: async () => [], loadClients: async () => [] }))

async function demoPage(filters: Record<string, string>) {
  const page = await loadAuditPage(parseAuditFilters(filters), 0, 100)
  if (!page) throw new Error('a demonstracao sempre responde')
  return page
}

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'development')
})

afterEach(() => {
  vi.unstubAllEnvs()
  loadOptional.mockReset()
})

describe('auditoria de demonstracao', () => {
  it('lista do mais recente para o mais antigo, com codigos EVT unicos', () => {
    const events = demoAuditEvents()
    const times = events.map((event) => event.occurredAt)
    expect(times).toEqual(times.toSorted().toReversed())
    expect(new Set(events.map((event) => event.code)).size).toBe(events.length)
    expect(events.some((event) => event.actorName === null)).toBe(true)
  })

  it('filtra por periodo, usuario, entidade, acao e inspecao', { timeout: 20_000 }, async () => {
    const all = await demoPage({ period: 'all' })
    const week = await demoPage({})
    expect(week.totalElements).toBeLessThanOrEqual(all.totalElements)

    const actor = all.content.find((event) => event.actorId)?.actorId ?? ''
    expect((await demoPage({ period: 'all', actorId: actor })).content.every((event) => event.actorId === actor)).toBe(true)

    const evidence = await demoPage({ period: 'all', entityType: 'EVIDENCE' })
    expect(evidence.content.every((event) => event.entityType === 'EVIDENCE')).toBe(true)

    const canceled = await demoPage({ period: 'all', action: 'INSPECTION_CANCELED' })
    expect(canceled.content.every((event) => event.action === 'INSPECTION_CANCELED')).toBe(true)

    const inspection = await demoPage({ period: 'all', inspectionId: DEMO_REVIEW_ID })
    expect(inspection.totalElements).toBeGreaterThan(5)
    expect(inspection.content.every((event) => event.inspectionId === DEMO_REVIEW_ID)).toBe(true)
  })

  it('oferece usuarios e acoes em linguagem de negocio', async () => {
    const options = await loadAuditFilterOptions()
    expect(options.actors.length).toBeGreaterThan(0)
    expect(options.actions).toContainEqual({ value: 'INSPECTION_APPROVED', label: 'Supervisor aprovou' })
  })
})

describe('fora da demonstracao', () => {
  it('pede a pagina a API com os filtros e o periodo como data inicial', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'production')
    loadOptional.mockResolvedValue(null)

    expect(await loadAuditPage(parseAuditFilters({ period: 'all', action: 'INSPECTION_CANCELED' }), 2)).toBeNull()
    expect(loadOptional).toHaveBeenCalledWith('/audit-events', {
      from: undefined,
      actorId: undefined,
      entityType: undefined,
      action: 'INSPECTION_CANCELED',
      inspectionId: undefined,
      page: 2,
      size: 20,
      sort: 'occurredAt,desc',
    })
  })
})
