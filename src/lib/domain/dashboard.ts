import { INSPECTION_STATUSES, type InspectionStatus } from '@/lib/domain/inspection'
import type { Severity } from '@/lib/domain/inspection-review'

/**
 * Indicadores do dashboard (documento 14.5 e issue #28), no formato que a tela
 * espera de `GET /dashboard/summary` (documento 12.16).
 *
 * Os recortes "aguardando revisao" e "atrasada" sao os mesmos da listagem de
 * inspecoes: cada numero do painel leva a lista com o filtro aplicado, e os dois
 * precisam bater.
 */
export type DashboardSummary = {
  /** Total por estado; estado sem inspecao vem como zero. */
  readonly inspectionsByStatus: Readonly<Record<InspectionStatus, number>>
  /** Enviadas ou em revisao (`AWAITING_REVIEW`). */
  readonly awaitingReview: number
  /** Atrasadas hoje, pela regra de `isOverdue`. */
  readonly overdue: number
  /** Atrasadas no fim do dia anterior, para a variacao do cartao. */
  readonly overdueYesterday: number
}

/**
 * Linha de "Nao conformidades recentes": a nao conformidade (documento 10.10.1)
 * com o local da inspecao a que pertence, mais nova primeiro.
 */
export type RecentNonConformity = {
  readonly id: string
  readonly inspectionId: string
  readonly inspectionCode: string
  readonly title: string
  readonly description: string
  readonly severity: Severity
  readonly siteName: string
  /** Horario de campo do registro (`created_at_device`). */
  readonly reportedAt: string
}

/** Quantas nao conformidades o cartao mostra. */
export const RECENT_NON_CONFORMITIES_LIMIT = 3

/**
 * Estados encerrados: aprovada e cancelada nao voltam ao fluxo. A reprovada
 * volta para o tecnico corrigir (RN-043 e RN-083), entao continua ativa.
 */
export const CLOSED_STATUSES: readonly InspectionStatus[] = ['APPROVED', 'CANCELED']

export function emptyStatusCounts(): Record<InspectionStatus, number> {
  return Object.fromEntries(INSPECTION_STATUSES.map((status) => [status, 0])) as Record<InspectionStatus, number>
}

/** Inspecoes ainda no fluxo, o "Total ativo" do cartao de estados. */
export function activeTotal(counts: Readonly<Record<InspectionStatus, number>>): number {
  return INSPECTION_STATUSES.filter((status) => !CLOSED_STATUSES.includes(status)).reduce(
    (total, status) => total + (counts[status] ?? 0),
    0,
  )
}

/** Operacao sem nenhuma inspecao, nem encerrada: pede estado vazio, nao zeros. */
export function hasNoInspections(counts: Readonly<Record<InspectionStatus, number>>): boolean {
  return INSPECTION_STATUSES.every((status) => (counts[status] ?? 0) === 0)
}

/** Variacao das atrasadas desde ontem, com sinal: `+3`, `-2` ou `0`. */
export function overdueDelta(summary: Pick<DashboardSummary, 'overdue' | 'overdueYesterday'>): number {
  return summary.overdue - summary.overdueYesterday
}

export function overdueDeltaLabel(delta: number): string {
  if (delta === 0) return 'Sem variação desde ontem'
  return `${delta > 0 ? '+' : '−'}${Math.abs(delta)} desde ontem`
}
