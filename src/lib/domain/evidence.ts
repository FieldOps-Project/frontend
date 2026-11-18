/**
 * Evidencia fotografica (documento 10.9.1 e issue #19), no formato que a tela
 * espera de `GET /inspections/{id}/evidence`.
 *
 * O arquivo nao tem URL publica: a imagem sai sempre pelo Route Handler
 * `/api/evidence/{id}`, que confere a sessao antes de repassar o binario da
 * API. A API ainda nao publica as evidencias (backend #22); estes tipos sao o
 * contrato que a tela pede ao backend.
 */

/** O que a tela precisa de uma foto para mostrar a miniatura e a ampliacao. */
export type EvidencePhoto = {
  readonly id: string
  readonly description: string | null
  /** Horario da captura no relogio do dispositivo. */
  readonly capturedAtDevice: string
  readonly latitude: number | null
  readonly longitude: number | null
  /** Confirmacao do arquivo; `null` enquanto so os metadados chegaram ao servidor. */
  readonly uploadedAt: string | null
}

/** Evidencia da inspecao com o item a que pertence (RN-045). */
export type Evidence = EvidencePhoto & {
  readonly inspectionId: string
  readonly responseId: string | null
  readonly nonConformityId: string | null
  /** Item do snapshot da resposta; `null` quando a foto vale para a inspecao como um todo. */
  readonly itemId: string | null
  readonly itemCode: string | null
  readonly itemTitle: string | null
  readonly serverReceivedAt: string | null
}

/** Miniatura na galeria; resolucao integral so na ampliacao (issue #19). */
export type EvidenceVariant = 'thumbnail' | 'original'

export const EVIDENCE_VARIANTS: readonly EvidenceVariant[] = ['thumbnail', 'original']

export function evidenceSrc(id: string, variant: EvidenceVariant): string {
  return `/api/evidence/${id}?variant=${variant}`
}

/** Metadados recebidos e arquivo ainda nao enviado pelo aplicativo. */
export function isPendingUpload(photo: Pick<EvidencePhoto, 'uploadedAt'>): boolean {
  return photo.uploadedAt === null
}

export type EvidenceGroup = {
  readonly key: string
  readonly itemCode: string | null
  readonly itemTitle: string | null
  readonly evidences: readonly Evidence[]
}

/** Compara `1.10` depois de `1.9`, como o checklist numera. */
function byItemCode(a: string, b: string): number {
  return a.localeCompare(b, 'pt-BR', { numeric: true })
}

/**
 * Agrupa as evidencias pelo item a que pertencem, na ordem do checklist; as
 * que nao tem item ficam num grupo proprio, no fim.
 */
export function groupByItem(evidences: readonly Evidence[]): readonly EvidenceGroup[] {
  const groups = new Map<string, Evidence[]>()
  for (const evidence of evidences) {
    const key = evidence.itemId ?? 'none'
    groups.set(key, [...(groups.get(key) ?? []), evidence])
  }

  return [...groups.entries()]
    .map(([key, items]) => ({
      key,
      itemCode: items[0]?.itemCode ?? null,
      itemTitle: items[0]?.itemTitle ?? null,
      evidences: items.toSorted((a, b) => a.capturedAtDevice.localeCompare(b.capturedAtDevice)),
    }))
    .toSorted((a, b) => {
      if (a.itemCode === null) return 1
      if (b.itemCode === null) return -1
      return byItemCode(a.itemCode, b.itemCode)
    })
}
