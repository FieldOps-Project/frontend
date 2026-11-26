import type { InspectionStatus } from '@/lib/domain/inspection'
import {
  cancellationOf,
  executionTimesOf,
  type Cancellation,
  type ExecutionTimes,
  type InspectionHistoryEntry,
} from '@/lib/domain/inspection-history'
import type { InspectionPriority } from '@/lib/domain/inspection-scheduling'

export type InspectionRecord = {
  readonly id: string
  readonly templateVersionId: string
  readonly clientId: string
  readonly siteId: string
  readonly equipmentId: string | null
  readonly technicianId: string | null
  readonly supervisorId: string | null
  readonly title: string
  readonly instructions: string | null
  readonly priority: InspectionPriority
  readonly status: InspectionStatus
  readonly scheduledFor: string
  readonly createdAt: string
  readonly updatedAt: string
  readonly itemSnapshots: readonly { readonly id: string }[]
}

export type TemplateVersionRecord = {
  readonly title: string
  readonly versionNumber: number
}

export type InspectionDetail = ExecutionTimes &
  Cancellation & {
    readonly id: string
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
    readonly applicableItems: number
    readonly createdAt: string
    readonly updatedAt: string
  }

export type InspectionDetailParts = {
  readonly inspection: InspectionRecord
  readonly template: TemplateVersionRecord
  readonly clientName: string
  readonly siteName: string
  readonly equipmentName: string | null
  readonly technicianName: string | null
  readonly supervisorName: string | null
  readonly history: readonly InspectionHistoryEntry[]
}

export function composeInspectionDetail(parts: InspectionDetailParts): InspectionDetail {
  const { inspection, template, history } = parts
  const canceled = inspection.status === 'CANCELED'

  return {
    id: inspection.id,
    title: inspection.title,
    status: inspection.status,
    priority: inspection.priority,
    templateVersionId: inspection.templateVersionId,
    templateTitle: template.title,
    templateVersionNumber: template.versionNumber,
    clientId: inspection.clientId,
    clientName: parts.clientName,
    siteId: inspection.siteId,
    siteName: parts.siteName,
    equipmentId: inspection.equipmentId,
    equipmentName: parts.equipmentName,
    technicianId: inspection.technicianId,
    technicianName: parts.technicianName,
    supervisorId: inspection.supervisorId,
    supervisorName: parts.supervisorName,
    scheduledFor: inspection.scheduledFor,
    instructions: inspection.instructions,
    applicableItems: inspection.itemSnapshots.length,
    ...executionTimesOf(history),
    ...(canceled ? cancellationOf(history) : { canceledByName: null, canceledAt: null, canceledReason: null }),
    createdAt: inspection.createdAt,
    updatedAt: inspection.updatedAt,
  }
}

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
  INSPECTION_REPORT_EXPORTED: 'Relatório exportado',
  RESPONSE_CREATED: 'Resposta registrada',
  RESPONSE_UPDATED: 'Resposta alterada',
  EVIDENCE_ADDED: 'Fotografia capturada',
  EVIDENCE_REMOVED: 'Fotografia removida',
  NON_CONFORMITY_CREATED: 'Não conformidade criada',
  NON_CONFORMITY_UPDATED: 'Não conformidade atualizada',
}

export function historyActionLabel(action: string): string {
  return HISTORY_ACTION_LABELS[action] ?? action
}

export type CancelInspectionRequest = {
  readonly reason: string
}

export type InspectionTransitionResponse = {
  readonly id: string
  readonly previousStatus: InspectionStatus
  readonly status: InspectionStatus
  readonly technicianId: string | null
  readonly canceledBy: string | null
  readonly canceledAt: string | null
  readonly canceledReason: string | null
}

export type UpdateInspectionPlanningRequest = {
  readonly clientId: string
  readonly siteId: string
  readonly equipmentId: string | null
  readonly technicianId: string
  readonly supervisorId: string | null
  readonly title: string
  readonly instructions: string | null
  readonly priority: InspectionPriority
  readonly scheduledFor: string
}

export const CANCEL_REASON_MAX_LENGTH = 1000

const CANCELABLE: readonly InspectionStatus[] = ['ASSIGNED', 'IN_PROGRESS', 'REJECTED']

const REVIEWABLE: readonly InspectionStatus[] = ['SUBMITTED', 'UNDER_REVIEW']

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

export function scheduledDateInSaoPaulo(scheduledFor: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(scheduledFor))
}
