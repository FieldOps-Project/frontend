import { describe, expect, it } from 'vitest'

import {
  activeTotal,
  emptyStatusCounts,
  hasNoInspections,
  nonConformityTotal,
  toDashboardSummary,
  type DashboardSummaryRecord,
} from '@/lib/domain/dashboard'

const RECORD: DashboardSummaryRecord = {
  totalInspections: 9,
  overdueInspections: 3,
  inspectionsAwaitingReview: 2,
  inspectionsByStatus: [
    { status: 'ASSIGNED', count: 1 },
    { status: 'SUBMITTED', count: 4 },
    { status: 'UNDER_REVIEW', count: 2 },
    { status: 'APPROVED', count: 2 },
  ],
  nonConformitiesBySeverity: [
    { severity: 'LOW', count: 1 },
    { severity: 'CRITICAL', count: 5 },
  ],
}

describe('toDashboardSummary', () => {
  it('transforma a lista por estado em totais, com zero para o que a API nao devolveu', () => {
    const { inspectionsByStatus } = toDashboardSummary(RECORD)

    expect(inspectionsByStatus.ASSIGNED).toBe(1)
    expect(inspectionsByStatus.DRAFT).toBe(0)
    expect(Object.keys(inspectionsByStatus)).toHaveLength(8)
  })

  it('soma enviadas e em revisao em aguardando revisao, sem usar o numero da API', () => {
    expect(toDashboardSummary(RECORD).awaitingReview).toBe(6)
  })

  it('leva as atrasadas da API', () => {
    expect(toDashboardSummary(RECORD).overdue).toBe(3)
  })

  it('transforma a lista por criticidade em totais', () => {
    const { nonConformitiesBySeverity } = toDashboardSummary(RECORD)

    expect(nonConformitiesBySeverity).toEqual({ LOW: 1, MEDIUM: 0, HIGH: 0, CRITICAL: 5 })
    expect(nonConformityTotal(nonConformitiesBySeverity)).toBe(6)
  })
})

describe('totais por estado', () => {
  it('comeca com todos os estados zerados', () => {
    const counts = emptyStatusCounts()
    expect(Object.values(counts)).toHaveLength(8)
    expect(Object.values(counts).every((value) => value === 0)).toBe(true)
  })

  it('soma no total ativo tudo menos aprovadas e canceladas', () => {
    const counts = { ...emptyStatusCounts(), DRAFT: 2, ASSIGNED: 3, IN_PROGRESS: 4, REJECTED: 1, APPROVED: 50, CANCELED: 7 }
    expect(activeTotal(counts)).toBe(10)
  })

  it('reconhece operacao sem nenhuma inspecao', () => {
    expect(hasNoInspections(emptyStatusCounts())).toBe(true)
    expect(hasNoInspections({ ...emptyStatusCounts(), CANCELED: 1 })).toBe(false)
  })
})
