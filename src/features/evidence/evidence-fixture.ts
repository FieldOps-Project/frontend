import 'server-only'

import { demoInspectionDetail } from '@/features/inspections/detail-fixture'
import { DEMO_REVIEW, DEMO_REVIEW_ID } from '@/features/inspections/review-fixture'
import { demoNonConformities, demoNonConformityId } from '@/features/non-conformities/non-conformity-fixture'
import type { EvidencePhoto } from '@/lib/domain/evidence'

export type DemoEvidence = EvidencePhoto & {
  readonly inspectionId: string
  readonly responseId: string | null
  readonly nonConformityId: string | null
  readonly itemId: string | null
  readonly itemCode: string | null
  readonly itemTitle: string | null
  readonly serverReceivedAt: string | null
}

/**
 * Evidencias de demonstracao, servidas so em `NEXT_PUBLIC_APP_ENV=development`
 * enquanto a API nao publica `/inspections/{id}/evidence` (backend #22).
 *
 * Sao as mesmas fotos que a revisao e as nao conformidades ja mostram, com o
 * item de cada uma: assim a galeria da inspecao, a revisao e o detalhe da nao
 * conformidade apontam para o mesmo arquivo. A imagem e desenhada aqui mesmo,
 * em SVG, com a descricao da foto -- nao ha binario de exemplo no repositorio.
 */
/** As nao conformidades da revisao tem, na listagem, os identificadores 1 a 3 da demonstracao. */
function reviewNonConformityId(itemId: string): string | null {
  const index = DEMO_REVIEW.nonConformities.findIndex((nc) => nc.itemId === itemId)
  return index === -1 ? null : demoNonConformityId(index + 1)
}

/**
 * As fotos da revisao tem horarios fixos do prototipo; na galeria e na linha do
 * tempo elas acompanham a execucao de demonstracao, que e relativa a hoje.
 */
function shiftToExecution(value: string | null, now: Date): string | null {
  const started = demoInspectionDetail(DEMO_REVIEW_ID, now)?.startedAtDevice
  if (!value || !started || !DEMO_REVIEW.startedAtDevice) return value
  const offset = Date.parse(value) - Date.parse(DEMO_REVIEW.startedAtDevice)
  return new Date(Date.parse(started) + offset).toISOString()
}

function reviewEvidences(now: Date): DemoEvidence[] {
  const submitted = demoInspectionDetail(DEMO_REVIEW_ID, now)?.submittedAtServer ?? null
  return DEMO_REVIEW.sections.flatMap((section) =>
    section.items.flatMap((item) =>
      item.photos.map((photo) => ({
        ...photo,
        capturedAtDevice: shiftToExecution(photo.capturedAtDevice, now) ?? photo.capturedAtDevice,
        uploadedAt: photo.uploadedAt === null ? null : submitted,
        inspectionId: DEMO_REVIEW_ID,
        responseId: null,
        nonConformityId: reviewNonConformityId(item.id),
        itemId: item.id,
        itemCode: item.code,
        itemTitle: item.title,
        serverReceivedAt: submitted,
      })),
    ),
  )
}

function nonConformityEvidences(now: Date): DemoEvidence[] {
  return demoNonConformities(now)
    .filter((nc) => nc.inspectionId !== DEMO_REVIEW_ID)
    .flatMap((nc) =>
      nc.evidences.map((photo) => ({
        ...photo,
        inspectionId: nc.inspectionId,
        responseId: null,
        nonConformityId: nc.id,
        itemId: nc.origin?.itemId ?? null,
        itemCode: nc.origin?.itemCode ?? null,
        itemTitle: nc.origin?.question ?? null,
        serverReceivedAt: nc.serverReceivedAt,
      })),
    )
}

export function demoEvidences(now: Date = new Date()): readonly DemoEvidence[] {
  return [...reviewEvidences(now), ...nonConformityEvidences(now)]
}
