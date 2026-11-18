import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { IoCreateOutline, IoEyeOutline } from 'react-icons/io5'

import { FlashNotice, Notice } from '@/components/ui/notice'
import { CancelInspection } from '@/features/inspections/cancel-inspection'
import { isDemoInspection, loadInspectionDetail, loadInspectionHistory } from '@/features/inspections/detail-data'
import {
  CancellationNotice,
  DetailHeader,
  ExecutionDetails,
  PlanningDetails,
  StatusHistory,
} from '@/features/inspections/detail-view'
import { requireRole } from '@/lib/dal'
import { canCancel, canEditPlanning, canOpenReview } from '@/lib/domain/inspection-detail'
import { dayInSaoPaulo } from '@/lib/domain/inspection-list'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { isId } from '@/lib/ids'
import { param } from '@/lib/search-params'

export const metadata: Metadata = {
  title: 'Detalhe da inspeção — FieldOps',
}

const REVIEW_BUTTON =
  'inline-flex h-11 items-center gap-2 rounded-field bg-brand-700 px-5 text-base font-semibold text-neutral-0 transition-colors hover:bg-brand-800'

const EDIT_LINK =
  'inline-flex h-9 items-center gap-1.5 rounded-field border border-neutral-200 px-3 text-sm font-medium text-brand-700 transition-colors hover:bg-neutral-100'

/**
 * Detalhe administrativo da inspecao (documento 14.9, issue #18).
 *
 * Administrador e supervisor consultam e cancelam (matriz 5.2). Cada acao so
 * aparece no estado que a aceita (documento 7.6): botao que aparece e depois
 * falha com 409 e pior do que botao ausente.
 */
export default async function InspectionDetailPage(props: PageProps<'/inspections/[inspectionId]'>) {
  const user = await requireRole(MANAGER_ROLES)
  const [{ inspectionId }, searchParams] = await Promise.all([props.params, props.searchParams])

  if (!isId(inspectionId)) {
    notFound()
  }

  const [inspection, history] = await Promise.all([
    loadInspectionDetail(inspectionId),
    loadInspectionHistory(inspectionId),
  ])

  const editable = canEditPlanning(inspection.status)
  const reviewable = canOpenReview(inspection.status)
  const cancelable = canCancel(inspection.status)

  return (
    <div className="flex flex-col gap-8">
      <DetailHeader
        inspection={inspection}
        actions={
          (reviewable || cancelable) && (
            <div className="flex shrink-0 flex-wrap gap-3">
              {cancelable && <CancelInspection inspectionId={inspection.id} code={inspection.code} />}
              {reviewable && (
                <Link href={`/inspections/${inspection.id}/review`} className={REVIEW_BUTTON}>
                  <IoEyeOutline aria-hidden className="size-5" />
                  {user.role === 'SUPERVISOR' ? 'Revisar' : 'Ver revisão'}
                </Link>
              )}
            </div>
          )
        }
      />

      <FlashNotice code={param(searchParams, 'notice')} />

      {isDemoInspection(inspection.id) && (
        <Notice tone="warning">
          Dados de demonstração: a API ainda não publica o detalhe, o histórico nem a edição da inspeção. Cancelamentos
          e alterações ficam guardados até reiniciar o servidor.
        </Notice>
      )}

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
        <StatusHistory events={history} />
      </div>
    </div>
  )
}
