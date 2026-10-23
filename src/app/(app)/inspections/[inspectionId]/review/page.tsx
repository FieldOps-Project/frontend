import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Notice } from '@/components/ui/notice'
import { canDecide, isDemoReview, loadInspectionReview } from '@/features/inspections/review-data'
import { ReviewDecision } from '@/features/inspections/review-decision'
import {
  ChecklistResponses,
  ExecutionDetails,
  InspectionSummary,
  LockedNotice,
  NonConformitiesPanel,
  ReviewHeader,
  ReviewHistory,
} from '@/features/inspections/review-view'
import { requireRole } from '@/lib/dal'
import { reviewItems } from '@/lib/domain/inspection-review'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { isId } from '@/lib/ids'

export const metadata: Metadata = {
  title: 'Revisão da inspeção — FieldOps',
}

/**
 * Revisao da inspecao (documento 14.11, issues #22 e #23).
 *
 * Administrador e supervisor consultam; so o supervisor decide (RN-079). As
 * respostas do tecnico sao somente leitura (RN-084): a tela nao oferece nenhum
 * caminho para altera-las.
 */
export default async function InspectionReviewPage(props: PageProps<'/inspections/[inspectionId]/review'>) {
  const user = await requireRole(MANAGER_ROLES)
  const { inspectionId } = await props.params

  if (!isId(inspectionId)) {
    notFound()
  }

  const review = await loadInspectionReview(inspectionId)
  const decides = canDecide(user.role, review)
  const items = reviewItems(review)

  return (
    <div className="flex flex-col gap-8">
      <ReviewHeader
        review={review}
        actions={
          decides ? (
            <ReviewDecision
              inspectionId={review.id}
              correctableItems={items.map(({ id, code, title }) => ({ id, code, title }))}
              suggestedItemIds={review.nonConformities.flatMap((nc) => (nc.itemId ? [nc.itemId] : []))}
            />
          ) : (
            <p className="max-w-xs text-sm text-neutral-600">
              Somente o supervisor responsável aprova ou reprova esta inspeção.
            </p>
          )
        }
      />

      {isDemoReview(review.id) && (
        <Notice tone="warning">
          Dados de demonstração: os endpoints de inspeção ainda não existem na API, e as decisões não são enviadas.
        </Notice>
      )}

      <LockedNotice />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <ExecutionDetails review={review} />
        <InspectionSummary review={review} />
      </div>

      <NonConformitiesPanel nonConformities={review.nonConformities} />

      <ChecklistResponses review={review} />

      <ReviewHistory review={review} />
    </div>
  )
}
