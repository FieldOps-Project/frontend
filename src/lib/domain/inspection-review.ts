import type { InspectionStatus } from '@/lib/domain/inspection'
import type { StatusTone } from '@/lib/domain/page'

/**
 * Dados da tela de revisao (documento 14.11), no formato do modelo de dados:
 * inspecao (10.8), snapshot de itens (10.8.3), respostas (10.8.4), evidencias
 * (10.9.1), nao conformidades e revisoes (10.11.1).
 *
 * A API ainda nao publica os endpoints de inspecao; quando publicar, estes
 * tipos sao o ponto de encontro com o contrato.
 */

/** Criticidade da nao conformidade (RN-054). */
export const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
export type Severity = (typeof SEVERITIES)[number]

export const SEVERITY_LABELS: Record<Severity, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
}

export type Conformity = 'CONFORMING' | 'NON_CONFORMING' | 'NOT_APPLICABLE'

export const CONFORMITY_LABELS: Record<Conformity, string> = {
  CONFORMING: 'Conforme',
  NON_CONFORMING: 'Não Conforme',
  NOT_APPLICABLE: 'Não se aplica',
}

export const CONFORMITY_TONES: Record<Conformity, StatusTone> = {
  CONFORMING: 'success',
  NON_CONFORMING: 'danger',
  NOT_APPLICABLE: 'neutral',
}

export type ReviewDecision = 'APPROVED' | 'REJECTED'

export type GeoPoint = {
  readonly latitude: number
  readonly longitude: number
  /** Precisao em metros, quando o dispositivo informou (RN-062). */
  readonly accuracy: number | null
}

export type ReviewPhoto = {
  readonly id: string
  readonly description: string | null
  readonly capturedAtDevice: string
}

/** Item do snapshot com a resposta do tecnico. */
export type ReviewItem = {
  readonly id: string
  /** Numeracao exibida, como `1.2`. */
  readonly code: string
  readonly title: string
  readonly required: boolean
  readonly responseType: 'CONFORMITY' | 'NUMBER' | 'BOOLEAN' | 'TEXT_SHORT'
  readonly conformity: Conformity | null
  /** Valor ja formatado para leitura, para os tipos que nao sao de conformidade. */
  readonly displayValue: string | null
  readonly observation: string | null
  readonly photos: readonly ReviewPhoto[]
}

export type ReviewSection = {
  readonly id: string
  readonly order: number
  readonly title: string
  readonly items: readonly ReviewItem[]
}

export type ReviewNonConformity = {
  readonly id: string
  /** Item do snapshot relacionado (RN-053). */
  readonly itemId: string | null
  readonly itemCode: string | null
  readonly title: string
  readonly description: string
  readonly severity: Severity
}

export type ReviewRecord = {
  readonly id: string
  readonly cycle: number
  readonly decision: ReviewDecision
  readonly reviewerName: string
  readonly reason: string | null
  readonly comments: string | null
  readonly reviewedAt: string
}

export type InspectionReview = {
  readonly id: string
  /** Codigo de apresentacao, como `INSP-2023-0892`. */
  readonly code: string
  readonly title: string
  readonly status: InspectionStatus
  readonly technicianName: string
  readonly equipmentName: string
  readonly siteName: string
  /** Horarios do dispositivo e do servidor ficam separados (RN-074). */
  readonly startedAtDevice: string | null
  readonly completedAtDevice: string | null
  readonly submittedAtServer: string | null
  readonly startLocation: GeoPoint | null
  readonly sections: readonly ReviewSection[]
  readonly nonConformities: readonly ReviewNonConformity[]
  readonly reviews: readonly ReviewRecord[]
}

export function reviewItems(review: InspectionReview): readonly ReviewItem[] {
  return review.sections.flatMap((section) => section.items)
}

/** Item respondido: tem conformidade ou valor registrado. */
export function isAnswered(item: ReviewItem): boolean {
  return item.conformity !== null || item.displayValue !== null
}

/** Duracao da execucao pelo relogio do dispositivo, como `2h 45m`. */
export function executionDuration(review: InspectionReview): string | null {
  if (!review.startedAtDevice || !review.completedAtDevice) return null
  const minutes = Math.round(
    (new Date(review.completedAtDevice).getTime() - new Date(review.startedAtDevice).getTime()) / 60_000,
  )
  if (!Number.isFinite(minutes) || minutes < 0) return null
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours > 0 ? `${hours}h ${rest}m` : `${rest}m`
}
