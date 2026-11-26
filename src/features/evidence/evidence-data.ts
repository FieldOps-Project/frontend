import 'server-only'

import { cache } from 'react'

import { loadInspectionNonConformityRecords } from '@/features/non-conformities/non-conformity-records'
import { load, verifySession } from '@/lib/dal'
import type { Evidence, EvidenceRecord } from '@/lib/domain/evidence'
import { FIELD_FINDINGS_ROLES } from '@/lib/domain/non-conformity'

export const loadEvidenceRecords = cache(
  (inspectionId: string): Promise<readonly EvidenceRecord[]> =>
    load<readonly EvidenceRecord[]>(`/inspections/${inspectionId}/evidence`),
)

export async function loadInspectionEvidences(inspectionId: string): Promise<readonly Evidence[] | null> {
  const user = await verifySession()
  if (!FIELD_FINDINGS_ROLES.includes(user.role)) return null

  const [records, nonConformities] = await Promise.all([
    loadEvidenceRecords(inspectionId),
    loadInspectionNonConformityRecords(inspectionId),
  ])
  const titles = new Map(nonConformities.map((nonConformity) => [nonConformity.id, nonConformity.title]))

  return records.map((record) => ({
    ...record,
    nonConformityTitle: record.nonConformityId ? (titles.get(record.nonConformityId) ?? null) : null,
  }))
}
