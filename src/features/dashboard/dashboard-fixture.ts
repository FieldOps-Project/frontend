import 'server-only'

import { demoInspections } from '@/features/inspections/list-fixture'
import { emptyStatusCounts, type DashboardSummary } from '@/lib/domain/dashboard'
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
