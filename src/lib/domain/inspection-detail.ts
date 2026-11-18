import type { InspectionStatus } from '@/lib/domain/inspection'
import type { GeoPoint } from '@/lib/domain/inspection-review'
import type { InspectionPriority } from '@/lib/domain/inspection-scheduling'

/**
 * Detalhe administrativo da inspecao (documento 14.9, issue #18), no formato do
 * modelo de dados (10.8.1) com os nomes ja resolvidos para a tela.
 *
 * A API ainda nao publica `GET /inspections/{id}` nem `/history`; estes tipos
 * sao o contrato que a tela pede ao backend. O cancelamento ja existe
 * (`POST /inspections/{id}/cancel`, backend #65) e segue a resposta real.
 */

/** Localizacao registrada pelo dispositivo, com o horario da captura (RN-061/062). */
export type RecordedLocation = GeoPoint & {
  readonly capturedAtDevice: string
}

export type InspectionDetail = {
  readonly id: string
  /** Codigo de apresentacao, como `INS-2023-089`. */
  readonly code: string
  readonly title: string
  readonly status: InspectionStatus
  readonly priority: InspectionPriority
  readonly templateVersionId: string
  readonly templateTitle: string
  readonly templateVersionNumber: number
  readonly clientId: string
  readonly clientName: string
  readonly siteId: string
  readonly siteName: string
  readonly equipmentId: string | null
  readonly equipmentName: string | null
  readonly technicianId: string | null
  readonly technicianName: string | null
  readonly supervisorId: string | null
  readonly supervisorName: string | null
  readonly scheduledFor: string
  readonly instructions: string | null
  /** Horarios do dispositivo e do servidor ficam separados (RN-074). */
  readonly startedAtDevice: string | null
  readonly startedAtServer: string | null
  readonly completedAtDevice: string | null
  readonly submittedAtServer: string | null
  readonly startLocation: RecordedLocation | null
  /** Progresso: itens respondidos sobre itens aplicaveis (RN-040). */
  readonly answeredItems: number
  readonly applicableItems: number
  /** Cancelamento registra usuario, data e justificativa (RN-029). */
  readonly canceledByName: string | null
  readonly canceledAt: string | null
  readonly canceledReason: string | null
  readonly createdAt: string
  readonly updatedAt: string
}

/** Acoes de auditoria que aparecem no historico da inspecao (documento 10.12.1). */
export const HISTORY_ACTION_LABELS: Record<string, string> = {
  INSPECTION_CREATED: 'Inspeção criada',
  INSPECTION_ASSIGNED: 'Inspeção atribuída ao técnico',
  INSPECTION_UPDATED: 'Planejamento alterado',
  INSPECTION_STARTED: 'Técnico iniciou a inspeção',
  INSPECTION_COMPLETED: 'Inspeção concluída no dispositivo',
  INSPECTION_SUBMITTED: 'Sincronização confirmada',
  REVIEW_STARTED: 'Supervisor iniciou a revisão',
  INSPECTION_APPROVED: 'Supervisor aprovou',
  INSPECTION_REJECTED: 'Supervisor solicitou correção',
  INSPECTION_REOPENED: 'Reaberta para correção',
  INSPECTION_CANCELED: 'Inspeção cancelada',
}

/** Evento do historico, vindo da auditoria (`GET /inspections/{id}/history`). */
export type InspectionHistoryEvent = {
  readonly id: string
  readonly action: string
  /** Nulo quando a acao foi do sistema. */
  readonly actorName: string | null
  /** Horario do servidor (RN-087). */
  readonly occurredAt: string
  /** Horario do dispositivo, quando a acao aconteceu no aplicativo (RN-074). */
  readonly deviceOccurredAt: string | null
  readonly previousStatus: InspectionStatus | null
  readonly newStatus: InspectionStatus | null
  /** Justificativa ou observacao do evento, como o motivo do cancelamento. */
  readonly note: string | null
}

export function historyActionLabel(action: string): string {
  return HISTORY_ACTION_LABELS[action] ?? action
}

/** Corpo de `POST /inspections/{id}/cancel` (backend #65). */
export type CancelInspectionRequest = {
  readonly reason: string
}

/** Resposta de `POST /inspections/{id}/cancel` (backend #65). */
export type InspectionTransitionResponse = {
  readonly id: string
  readonly previousStatus: InspectionStatus
  readonly status: InspectionStatus
  readonly technicianId: string | null
  readonly canceledBy: string | null
  readonly canceledAt: string | null
  readonly canceledReason: string | null
}

/** Corpo de `PUT /inspections/{id}`: os dados de planejamento que podem mudar. */
export type UpdateInspectionPlanningRequest = {
  readonly technicianId: string
  readonly supervisorId: string | null
  readonly scheduledFor: string
  readonly priority: InspectionPriority
  readonly instructions: string | null
}

/** Limite da justificativa, o mesmo da API (`@Size(max = 1000)`). */
export const CANCEL_REASON_MAX_LENGTH = 1000

/**
 * Estados que aceitam cancelamento (documento 7.6): atribuida, em execucao e
 * reprovada. Aprovada nao cancela pelo fluxo comum (RN-030); rascunho nao tem
 * transicao de cancelamento no MVP.
 */
const CANCELABLE: readonly InspectionStatus[] = ['ASSIGNED', 'IN_PROGRESS', 'REJECTED']

/** Revisao so existe com a inspecao enviada ou ja em revisao (documento 7.6). */
const REVIEWABLE: readonly InspectionStatus[] = ['SUBMITTED', 'UNDER_REVIEW']

/** Planejamento so muda antes de o tecnico iniciar a execucao (issue #18). */
const PLANNING_EDITABLE: readonly InspectionStatus[] = ['DRAFT', 'ASSIGNED']

export function canCancel(status: InspectionStatus): boolean {
  return CANCELABLE.includes(status)
}

export function canOpenReview(status: InspectionStatus): boolean {
  return REVIEWABLE.includes(status)
}

export function canEditPlanning(status: InspectionStatus): boolean {
  return PLANNING_EDITABLE.includes(status)
}

/** Data prevista (`AAAA-MM-DD`) no fuso da operacao, para o campo de data. */
export function scheduledDateInSaoPaulo(scheduledFor: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(scheduledFor))
}
