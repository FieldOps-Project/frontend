import 'server-only'

import { demoInspections } from '@/features/inspections/list-fixture'
import { DEMO_REVIEW, DEMO_REVIEW_ID } from '@/features/inspections/review-fixture'
import { emptyStatusCounts, type DashboardSummary, type RecentNonConformity } from '@/lib/domain/dashboard'
import { dayInSaoPaulo, isAwaitingReview, isOverdue } from '@/lib/domain/inspection-list'

/**
 * Indicadores de demonstracao, servidos so em `NEXT_PUBLIC_APP_ENV=development`
 * enquanto `GET /dashboard/summary` nao existe (backend #36).
 *
 * Saem das mesmas inspecoes de demonstracao da listagem e pelas mesmas regras
 * de atraso e de revisao: clicar em um numero do painel leva a uma lista com
 * exatamente aquela quantidade de linhas.
 */
export function demoDashboardSummary(now: Date = new Date()): DashboardSummary {
  const inspections = demoInspections(now)
  const today = dayInSaoPaulo(now)
  const yesterday = dayInSaoPaulo(new Date(now.getTime() - 86_400_000))

  const inspectionsByStatus = emptyStatusCounts()
  for (const inspection of inspections) {
    inspectionsByStatus[inspection.status] += 1
  }

  return {
    inspectionsByStatus,
    awaitingReview: inspections.filter(isAwaitingReview).length,
    overdue: inspections.filter((inspection) => isOverdue(inspection, today)).length,
    overdueYesterday: inspections.filter((inspection) => isOverdue(inspection, yesterday)).length,
  }
}

/** Dias atras de cada registro, para cobrir "Hoje", "Ontem" e data por extenso. */
const REPORTED = [
  { daysAgo: 0, time: '09:45' },
  { daysAgo: 1, time: '16:20' },
  { daysAgo: 16, time: '10:05' },
] as const

function at(now: Date, daysAgo: number, time: string): string {
  const base = new Date(`${dayInSaoPaulo(now)}T${time}:00-03:00`)
  return new Date(base.getTime() - daysAgo * 86_400_000).toISOString()
}

/**
 * Nao conformidades recentes: as da inspecao de demonstracao da revisao, a
 * unica que abre em desenvolvimento -- assim a seta de cada linha leva a uma
 * tela que existe.
 */
export function demoRecentNonConformities(now: Date = new Date()): readonly RecentNonConformity[] {
  return DEMO_REVIEW.nonConformities.map((nonConformity, index) => {
    const reported = REPORTED[index % REPORTED.length] ?? REPORTED[0]
    return {
      id: nonConformity.id,
      inspectionId: DEMO_REVIEW_ID,
      inspectionCode: DEMO_REVIEW.code,
      title: nonConformity.title,
      description: nonConformity.description,
      severity: nonConformity.severity,
      siteName: DEMO_REVIEW.siteName,
      reportedAt: at(now, reported.daysAgo, reported.time),
    }
  })
}
