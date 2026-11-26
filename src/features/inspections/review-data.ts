import 'server-only'

import { loadInspectionEvidences } from '@/features/evidence/evidence-data'
import { loadInspectionDetail } from '@/features/inspections/detail-data'
import { loadInspectionNonConformities } from '@/features/non-conformities/non-conformities-data'
import { load, loadIfPermitted } from '@/lib/dal'
import {
  buildSections,
  describeReview,
  reviewItems,
  type InspectionReview,
  type ItemSnapshotRecord,
  type ReviewApiRecord,
  type ReviewRecord,
  type ReviewSection,
} from '@/lib/domain/inspection-review'

type Named = { readonly name: string }

async function reviewerNames(records: readonly ReviewApiRecord[]): Promise<ReadonlyMap<string, string | null>> {
  const ids = [...new Set(records.map((record) => record.reviewerId))]
  const names = await Promise.all(ids.map(async (id) => (await loadIfPermitted<Named>(`/users/${id}`))?.name ?? null))
  return new Map(ids.map((id, index) => [id, names[index] ?? null]))
}

async function describeReviews(
  records: readonly ReviewApiRecord[],
  sections: readonly ReviewSection[],
): Promise<readonly ReviewRecord[]> {
  const names = await reviewerNames(records)
  const items = reviewItems({ sections })
  return records
    .toSorted((a, b) => a.reviewCycle - b.reviewCycle)
    .map((record) => describeReview(record, names.get(record.reviewerId) ?? null, items))
}

async function loadSections(inspectionId: string): Promise<readonly ReviewSection[]> {
  const record = await load<{ readonly itemSnapshots: readonly ItemSnapshotRecord[] }>(`/inspections/${inspectionId}`)
  return buildSections(record.itemSnapshots)
}

export async function loadInspectionReview(id: string): Promise<InspectionReview> {
  const [inspection, sections, nonConformities, evidences, records] = await Promise.all([
    loadInspectionDetail(id),
    loadSections(id),
    loadInspectionNonConformities(id),
    loadInspectionEvidences(id),
    loadIfPermitted<readonly ReviewApiRecord[]>(`/inspections/${id}/reviews`),
  ])
  const reviews = records === null ? null : await describeReviews(records, sections)

  return { inspection, sections, nonConformities, evidences, reviews }
}
