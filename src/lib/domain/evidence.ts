export type EvidencePhoto = {
  readonly id: string
  readonly description: string | null
  readonly capturedAtDevice: string
  readonly latitude: number | null
  readonly longitude: number | null
  readonly uploadedAt: string | null
}

export type EvidenceRecord = EvidencePhoto & {
  readonly inspectionId: string
  readonly responseId: string | null
  readonly nonConformityId: string | null
  readonly serverReceivedAt: string
}

export type Evidence = EvidenceRecord & {
  readonly nonConformityTitle: string | null
}

export type EvidenceGroup = {
  readonly key: string
  readonly nonConformityId: string | null
  readonly title: string | null
  readonly evidences: readonly Evidence[]
}

export function evidenceSrc(id: string): string {
  return `/api/evidence/${id}`
}

export function isPendingUpload(photo: Pick<EvidencePhoto, 'uploadedAt'>): boolean {
  return photo.uploadedAt === null
}

function byCapture(a: Evidence, b: Evidence): number {
  return a.capturedAtDevice.localeCompare(b.capturedAtDevice)
}

export function groupByNonConformity(evidences: readonly Evidence[]): readonly EvidenceGroup[] {
  const groups = new Map<string, Evidence[]>()
  for (const evidence of evidences) {
    const key = evidence.nonConformityId ?? 'none'
    groups.set(key, [...(groups.get(key) ?? []), evidence])
  }

  return [...groups.entries()]
    .map(([key, items]) => {
      const sorted = items.toSorted(byCapture)
      return {
        key,
        nonConformityId: sorted[0]?.nonConformityId ?? null,
        title: sorted[0]?.nonConformityTitle ?? null,
        evidences: sorted,
      }
    })
    .toSorted((a, b) => {
      if (a.nonConformityId === null) return 1
      if (b.nonConformityId === null) return -1
      return (a.evidences[0]?.capturedAtDevice ?? '').localeCompare(b.evidences[0]?.capturedAtDevice ?? '')
    })
}
