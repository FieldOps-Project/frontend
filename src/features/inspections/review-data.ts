import 'server-only'

import { notFound } from 'next/navigation'

import { DEMO_REVIEW, DEMO_REVIEW_ID } from '@/features/inspections/review-fixture'
import type { InspectionReview } from '@/lib/domain/inspection-review'
import type { UserRole } from '@/lib/domain/user'

export function isDemoReview(id: string): boolean {
  return id === DEMO_REVIEW_ID && process.env.NEXT_PUBLIC_APP_ENV === 'development'
}

/**
 * Inspecao com respostas, evidencias, nao conformidades e revisoes anteriores.
 *
 * Os endpoints de inspecao ainda nao existem na API: ate eles chegarem, so a
 * demonstracao de desenvolvimento e servida e qualquer outro identificador
 * responde 404. A integracao troca este corpo pelas leituras de
 * `GET /inspections/{id}`, `/responses`, `/non-conformities` e `/history`
 * (documento 12), mantendo o tipo de retorno.
 */
export async function loadInspectionReview(id: string): Promise<InspectionReview> {
  if (isDemoReview(id)) {
    return DEMO_REVIEW
  }
  notFound()
}

/**
 * Quem decide: so o supervisor revisa, aprova e reprova (RN-079 e matriz 5.2),
 * e so com a inspecao em revisao. O administrador acompanha em modo leitura.
 */
export function canDecide(role: UserRole, review: InspectionReview): boolean {
  return role === 'SUPERVISOR' && review.status === 'UNDER_REVIEW'
}
