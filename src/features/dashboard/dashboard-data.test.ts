import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { loadDashboardSummary, loadRecentNonConformities } from '@/features/dashboard/dashboard-data'
import { loadInspectionPage } from '@/features/inspections/list-data'
import { DEMO_REVIEW_ID } from '@/features/inspections/review-fixture'
import { INSPECTION_STATUSES } from '@/lib/domain/inspection'

vi.mock('server-only', () => ({}))

const loadOptional = vi.fn()
vi.mock('@/lib/dal', () => ({
  load: vi.fn(),
  loadOptional: (path: string, query: unknown) => loadOptional(path, query),
}))
vi.mock('@/features/catalog/lookups', () => ({ loadActiveUsers: async () => [], loadClients: async () => [] }))

afterEach(() => {
  loadOptional.mockReset()
  vi.unstubAllEnvs()
})

describe('dashboard em desenvolvimento', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'development')
  })

  it('cada total por estado bate com a lista filtrada por aquele estado', async () => {
    const summary = await loadDashboardSummary()
    expect(summary).not.toBeNull()

    for (const status of INSPECTION_STATUSES) {
      const page = await loadInspectionPage({ status }, 0)
      expect(summary?.inspectionsByStatus[status], status).toBe(page.totalElements)
    }
  })

  it('atrasadas e aguardando revisao batem com os filtros da lista', async () => {
    const summary = await loadDashboardSummary()

    expect(summary?.overdue).toBe((await loadInspectionPage({ overdue: true }, 0)).totalElements)
    expect(summary?.awaitingReview).toBe((await loadInspectionPage({ review: true }, 0)).totalElements)
  })

  it('nao conformidades recentes apontam para uma inspecao que abre', async () => {
    const recent = await loadRecentNonConformities()

    expect(recent?.length).toBeGreaterThan(0)
    expect(recent?.every((item) => item.inspectionId === DEMO_REVIEW_ID)).toBe(true)
    expect(loadOptional).not.toHaveBeenCalled()
  })
})

describe('dashboard com a API', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'production')
  })

  it('le o resumo de /dashboard/summary', async () => {
    loadOptional.mockResolvedValueOnce({ awaitingReview: 1 })
    await expect(loadDashboardSummary()).resolves.toEqual({ awaitingReview: 1 })
    expect(loadOptional).toHaveBeenCalledWith('/dashboard/summary', undefined)
  })

  it('pede so as tres mais recentes e devolve null sem o endpoint', async () => {
    loadOptional.mockResolvedValueOnce(null)
    await expect(loadRecentNonConformities()).resolves.toBeNull()
    expect(loadOptional).toHaveBeenCalledWith('/non-conformities', { size: 3, sort: 'reportedAt,desc' })
  })
})
