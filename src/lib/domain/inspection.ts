import type { StatusTone } from '@/lib/domain/page'

export const INSPECTION_STATUSES = [
  'DRAFT',
  'ASSIGNED',
  'IN_PROGRESS',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'CANCELED',
] as const

export type InspectionStatus = (typeof INSPECTION_STATUSES)[number]

export const INSPECTION_STATUS_LABELS: Record<InspectionStatus, string> = {
  DRAFT: 'Rascunho',
  ASSIGNED: 'Atribuída',
  IN_PROGRESS: 'Em execução',
  SUBMITTED: 'Enviada',
  UNDER_REVIEW: 'Em revisão',
  APPROVED: 'Aprovada',
  REJECTED: 'Reprovada',
  CANCELED: 'Cancelada',
}

export const INSPECTION_STATUS_TONES: Record<InspectionStatus, StatusTone> = {
  DRAFT: 'neutral',
  ASSIGNED: 'info',
  IN_PROGRESS: 'info',
  SUBMITTED: 'warning',
  UNDER_REVIEW: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  CANCELED: 'neutral',
}

export type InspectionSummary = {
  readonly id: string
  readonly title: string
  readonly status: string
  readonly scheduledAt: string
}

export function isInspectionStatus(value: string): value is InspectionStatus {
  return (INSPECTION_STATUSES as readonly string[]).includes(value)
}
