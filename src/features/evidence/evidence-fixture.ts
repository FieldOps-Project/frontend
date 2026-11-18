import 'server-only'

import { demoInspectionDetail } from '@/features/inspections/detail-fixture'
import { DEMO_REVIEW, DEMO_REVIEW_ID } from '@/features/inspections/review-fixture'
import { demoNonConformities, demoNonConformityId } from '@/features/non-conformities/non-conformity-fixture'
import type { Evidence, EvidenceVariant } from '@/lib/domain/evidence'

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

function reviewEvidences(now: Date): Evidence[] {
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

function nonConformityEvidences(now: Date): Evidence[] {
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

export function demoEvidences(now: Date = new Date()): readonly Evidence[] {
  return [...reviewEvidences(now), ...nonConformityEvidences(now)]
}

export function demoEvidence(id: string, now: Date = new Date()): Evidence | undefined {
  return demoEvidences(now).find((evidence) => evidence.id === id)
}

/** Cor estavel por foto, para cada miniatura ser reconhecivel na ampliacao. */
function hue(id: string): number {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 360
  return hash
}

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (char) => `&#${char.charCodeAt(0)};`)
}

/**
 * Imagem de demonstracao: um quadro com a descricao e o item. A miniatura sai
 * em 320x240 e o original em 1600x1200, como a API entregaria.
 */
export function demoEvidenceSvg(evidence: Evidence, variant: EvidenceVariant): string {
  const [width, height] = variant === 'thumbnail' ? [320, 240] : [1600, 1200]
  const color = hue(evidence.id)
  const title = escapeXml(evidence.description ?? 'Fotografia')
  const item = escapeXml(evidence.itemCode ? `Item ${evidence.itemCode}` : 'Inspeção')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 320 240">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="hsl(${color} 35% 42%)"/><stop offset="1" stop-color="hsl(${(color + 40) % 360} 30% 22%)"/>
  </linearGradient></defs>
  <rect width="320" height="240" fill="url(#g)"/>
  <circle cx="250" cy="62" r="26" fill="hsl(${color} 60% 80% / .35)"/>
  <path d="M0 190 L80 120 L140 170 L210 100 L320 196 L320 240 L0 240 Z" fill="hsl(${color} 25% 14% / .55)"/>
  <text x="16" y="28" font-family="Inter, Arial, sans-serif" font-size="13" font-weight="600" fill="#fff">${item}</text>
  <text x="16" y="222" font-family="Inter, Arial, sans-serif" font-size="12" fill="#fff">${title}</text>
</svg>`
}
