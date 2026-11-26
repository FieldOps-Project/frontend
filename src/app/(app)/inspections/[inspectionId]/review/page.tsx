import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { EvidenceGallery } from '@/features/evidence/evidence-gallery'
import { ExecutionDetails } from '@/features/inspections/detail-view'
import { loadInspectionReview } from '@/features/inspections/review-data'
import { BeginReview, ReviewDecision } from '@/features/inspections/review-decision'
import {
  ChecklistStructure,
  ReportCallout,
  ReviewHeader,
  ReviewHistory,
  ReviewSummary,
  StageHint,
} from '@/features/inspections/review-view'
import { InspectionNonConformities } from '@/features/non-conformities/non-conformity-view'
import { requireRole } from '@/lib/dal'
import { inspectionReference } from '@/lib/domain/inspection'
import { reviewItems, reviewStage, suggestedItemIds } from '@/lib/domain/inspection-review'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { isId } from '@/lib/ids'
import { param } from '@/lib/search-params'

export const metadata: Metadata = {
  title: 'Revisão da inspeção — FieldOps',
}

export default async function InspectionReviewPage(props: PageProps<'/inspections/[inspectionId]/review'>) {
  const user = await requireRole(MANAGER_ROLES)
  const [{ inspectionId }, searchParams] = await Promise.all([props.params, props.searchParams])

  if (!isId(inspectionId)) {
    notFound()
  }

  const review = await loadInspectionReview(inspectionId)
  const { inspection } = review
  const stage = reviewStage(user.role, inspection.status)
  const items = reviewItems(review)

  return (
    <div className="flex flex-col gap-8">
      <ReviewHeader
        inspection={inspection}
        back={
          param(searchParams, 'from') === 'queue'
            ? { href: '/inspections/review-queue', label: 'Fila de revisão' }
            : { href: `/inspections/${inspection.id}`, label: inspectionReference(inspection.id) }
        }
        actions={
          stage === 'begin' ? (
            <BeginReview inspectionId={inspection.id} />
          ) : stage === 'decide' ? (
            <ReviewDecision
              inspectionId={inspection.id}
              correctableItems={items.map(({ id, code, title }) => ({ id, code, title }))}
              suggestedItemIds={suggestedItemIds(items, review.nonConformities)}
            />
          ) : (
            <StageHint role={user.role} />
          )
        }
      />

      <ReportCallout inspectionId={inspection.id} withAnswers={review.answers !== null} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <ExecutionDetails inspection={inspection} />
        <ReviewSummary review={review} />
      </div>

      <InspectionNonConformities items={review.nonConformities} />

      <EvidenceGallery evidences={review.evidences} />

      <ChecklistStructure review={review} />

      <ReviewHistory review={review} />
    </div>
  )
}
