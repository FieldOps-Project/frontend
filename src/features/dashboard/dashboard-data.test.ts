import { afterEach, describe, expect, it, vi } from 'vitest'

import { loadDashboardSummary } from '@/features/dashboard/dashboard-data'

vi.mock('server-only', () => ({}))

const load = vi.fn()
vi.mock('@/lib/dal', () => ({ load: (path: string) => load(path) }))

afterEach(() => load.mockReset())

describe('loadDashboardSummary', () => {
  it('le o resumo de /dashboard/summary e o entrega no formato da tela', async () => {
    load.mockResolvedValueOnce({
      totalInspections: 5,
      overdueInspections: 2,
      inspectionsAwaitingReview: 0,
      inspectionsByStatus: [
        { status: 'SUBMITTED', count: 1 },
        { status: 'APPROVED', count: 4 },
      ],
      nonConformitiesBySeverity: [{ severity: 'MEDIUM', count: 1 }],
    })

    const summary = await loadDashboardSummary()

    expect(load).toHaveBeenCalledWith('/dashboard/summary')
    expect(summary.overdue).toBe(2)
    expect(summary.awaitingReview).toBe(1)
    expect(summary.inspectionsByStatus.APPROVED).toBe(4)
    expect(summary.nonConformitiesBySeverity.MEDIUM).toBe(1)
  })
})
