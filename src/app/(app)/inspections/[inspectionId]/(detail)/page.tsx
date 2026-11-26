import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { IoCreateOutline, IoDocumentTextOutline, IoEyeOutline } from 'react-icons/io5'

import { FlashNotice } from '@/components/ui/notice'
import { loadInspectionEvidences } from '@/features/evidence/evidence-data'
import { EvidenceGallery } from '@/features/evidence/evidence-gallery'
import { CancelInspection } from '@/features/inspections/cancel-inspection'
import { loadInspectionDetail, loadInspectionHistory } from '@/features/inspections/detail-data'
import {
  CancellationNotice,
  DetailHeader,
  ExecutionDetails,
  PlanningDetails,
  StatusHistory,
} from '@/features/inspections/detail-view'
import { loadInspectionNonConformities } from '@/features/non-conformities/non-conformities-data'
import { InspectionNonConformities } from '@/features/non-conformities/non-conformity-view'
import { requireRole } from '@/lib/dal'
import { canCancel, canEditPlanning, canOpenReview } from '@/lib/domain/inspection-detail'
import { inspectionReference } from '@/lib/domain/inspection'
import { dayInSaoPaulo } from '@/lib/domain/inspection-list'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { isId } from '@/lib/ids'
import { param } from '@/lib/search-params'

export const metadata: Metadata = {
  title: 'Detalhe da inspeção — FieldOps',
}

const REVIEW_BUTTON =
  'inline-flex h-11 items-center gap-2 rounded-field bg-brand-700 px-5 text-base font-semibold text-neutral-0 transition-colors hover:bg-brand-800'

const REPORT_LINK =
  'inline-flex h-11 items-center gap-2 rounded-field border border-neutral-200 bg-neutral-0 px-5 text-base font-semibold text-brand-700 transition-colors hover:bg-neutral-100'

const EDIT_LINK =
  'inline-flex h-9 items-center gap-1.5 rounded-field border border-neutral-200 px-3 text-sm font-medium text-brand-700 transition-colors hover:bg-neutral-100'

export default async function InspectionDetailPage(props: PageProps<'/inspections/[inspectionId]'>) {
  const user = await requireRole(MANAGER_ROLES)
  const [{ inspectionId }, searchParams] = await Promise.all([props.params, props.searchParams])

  if (!isId(inspectionId)) {
    notFound()
  }

  const [inspection, history, nonConformities, evidences] = await Promise.all([
    loadInspectionDetail(inspectionId),
    loadInspectionHistory(inspectionId),
    loadInspectionNonConformities(inspectionId),
    loadInspectionEvidences(inspectionId),
  ])

  const editable = canEditPlanning(inspection.status)
  const reviewable = canOpenReview(inspection.status)
  const cancelable = canCancel(inspection.status)

  return (
    <div className="flex flex-col gap-8">
      <DetailHeader
        inspection={inspection}
        actions={
          <div className="flex shrink-0 flex-wrap gap-3">
            <a href={`/api/inspections/${inspection.id}/report`} download className={REPORT_LINK}>
              <IoDocumentTextOutline aria-hidden className="size-5" />
              Baixar relatório (PDF)
            </a>
            {cancelable && <CancelInspection inspectionId={inspection.id} reference={inspectionReference(inspection.id)} />}
            {reviewable && (
              <Link href={`/inspections/${inspection.id}/review`} className={REVIEW_BUTTON}>
                <IoEyeOutline aria-hidden className="size-5" />
                {user.role === 'SUPERVISOR' ? 'Revisar' : 'Ver revisão'}
              </Link>
            )}
          </div>
        }
      />

      <FlashNotice code={param(searchParams, 'notice')} />

      <CancellationNotice inspection={inspection} />

      <PlanningDetails
        inspection={inspection}
        today={dayInSaoPaulo(new Date())}
        editAction={
          editable && (
            <Link href={`/inspections/${inspection.id}/edit`} className={EDIT_LINK}>
              <IoCreateOutline aria-hidden className="size-4" />
              Editar planejamento
            </Link>
          )
        }
        lockedReason={
          editable || inspection.status === 'CANCELED'
            ? null
            : 'Planejamento bloqueado para edição: a execução já foi iniciada pelo técnico.'
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <ExecutionDetails inspection={inspection} />
        <StatusHistory events={history} inspectionId={inspection.id} />
      </div>

      <InspectionNonConformities items={nonConformities} />

      <EvidenceGallery evidences={evidences} />
    </div>
  )
}
