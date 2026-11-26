import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  IoArrowBack,
  IoConstructOutline,
  IoDocumentTextOutline,
  IoListOutline,
  IoPersonOutline,
  IoPieChartOutline,
} from 'react-icons/io5'

import { StatusBadge } from '@/components/ui/status-badge'
import {
  INSPECTION_STATUS_LABELS,
  INSPECTION_STATUS_TONES,
  inspectionReference,
} from '@/lib/domain/inspection'
import type { InspectionDetail } from '@/lib/domain/inspection-detail'
import { reviewItems, type InspectionReview, type ReviewItem, type ReviewSection } from '@/lib/domain/inspection-review'
import { RESPONSE_TYPE_LABELS } from '@/lib/domain/template-builder'
import type { UserRole } from '@/lib/domain/user'
import { formatDateTime, orDash } from '@/lib/format'

const CARD = 'rounded-card border border-neutral-200 bg-neutral-0'

const REPORT_BUTTON =
  'inline-flex h-11 shrink-0 items-center gap-2 rounded-field bg-brand-700 px-5 text-base font-semibold text-neutral-0 transition-colors hover:bg-brand-800'

export function ReviewHeader({
  inspection,
  actions,
  back,
}: {
  inspection: InspectionDetail
  actions: ReactNode
  back: { readonly href: string; readonly label: string }
}) {
  return (
    <header className="-mx-4 -mt-6 flex flex-col gap-4 border-b border-neutral-200 bg-neutral-0 px-4 py-5 sm:-mx-6 sm:px-6">
      <Link href={back.href} className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline">
        <IoArrowBack aria-hidden className="size-4" />
        {back.label}
      </Link>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-950">{inspectionReference(inspection.id)}</h1>
            <StatusBadge
              label={INSPECTION_STATUS_LABELS[inspection.status]}
              tone={INSPECTION_STATUS_TONES[inspection.status]}
            />
          </div>
          <p className="text-base text-neutral-700">{inspection.title}</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-base text-neutral-700">
            <span className="flex items-center gap-2">
              <IoPersonOutline aria-hidden className="size-5" />
              <span className="sr-only">Técnico:</span>
              {orDash(inspection.technicianName)}
            </span>
            <span className="flex items-center gap-2">
              <IoConstructOutline aria-hidden className="size-5" />
              <span className="sr-only">Local e equipamento:</span>
              {inspection.siteName}
              {inspection.equipmentName && ` - ${inspection.equipmentName}`}
            </span>
          </div>
        </div>
        {actions}
      </div>
    </header>
  )
}

export function StageHint({ role }: { role: UserRole }) {
  return (
    <p className="max-w-xs text-sm text-neutral-600">
      {role === 'SUPERVISOR'
        ? 'Esta inspeção não está aguardando revisão.'
        : 'Somente o supervisor responsável inicia, aprova ou reprova a revisão.'}
    </p>
  )
}

export function ReportCallout({ inspectionId }: { inspectionId: string }) {
  return (
    <section aria-labelledby="report-title" className="flex flex-col gap-4 rounded-card border border-brand-200 bg-brand-50 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1 text-brand-700">
        <h2 id="report-title" className="text-lg font-semibold">
          Respostas do técnico
        </h2>
        <p className="max-w-2xl text-base">
          Esta tela mostra a estrutura do checklist, as não conformidades e as evidências. Baixe o relatório em PDF para
          conferir as respostas e observações de cada item.
        </p>
      </div>
      <a href={`/api/inspections/${inspectionId}/report`} download className={REPORT_BUTTON}>
        <IoDocumentTextOutline aria-hidden className="size-5" />
        Baixar relatório (PDF) para ver as respostas
      </a>
    </section>
  )
}

function Stat({ label, value, tone }: { label: string; value: ReactNode; tone: 'neutral' | 'danger' }) {
  return (
    <div
      className={`flex flex-col gap-1.5 rounded border p-4 ${
        tone === 'danger' ? 'border-danger/30 bg-danger-soft text-danger' : 'border-neutral-200 bg-neutral-100 text-neutral-900'
      }`}
    >
      <span className="text-sm">{label}</span>
      <span className="text-2xl font-semibold">{value}</span>
    </div>
  )
}

export function ReviewSummary({ review }: { review: InspectionReview }) {
  const items = reviewItems(review)

  return (
    <section aria-labelledby="summary-title" className={`${CARD} flex flex-col gap-5 p-6`}>
      <h2 id="summary-title" className="flex items-center gap-3 text-lg font-semibold text-neutral-900">
        <IoPieChartOutline aria-hidden className="size-6" />
        Resumo da inspeção
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Itens do checklist" value={items.length} tone="neutral" />
        <Stat label="Obrigatórios" value={items.filter((item) => item.required).length} tone="neutral" />
        <Stat label="Não conformidades" value={review.nonConformities?.length ?? '—'} tone="danger" />
        <Stat label="Fotografias" value={review.evidences?.length ?? '—'} tone="neutral" />
      </div>
    </section>
  )
}

function ChecklistItem({ item, flagged }: { item: ReviewItem; flagged: boolean }) {
  return (
    <li className={`flex flex-col gap-1 px-6 py-4 ${flagged ? 'border-l-4 border-danger' : ''}`}>
      <p className="text-base text-neutral-900">
        <span className="font-medium">{item.code}</span> {item.title}
      </p>
      {item.description && <p className="text-sm text-neutral-600">{item.description}</p>}
      <p className="flex flex-wrap items-center gap-2 text-xs text-neutral-700">
        <span className="rounded bg-neutral-100 px-2 py-0.5">{RESPONSE_TYPE_LABELS[item.responseType]}</span>
        <span className="rounded bg-neutral-100 px-2 py-0.5">{item.required ? 'Obrigatório' : 'Opcional'}</span>
        {flagged && <span className="rounded bg-danger-soft px-2 py-0.5 text-danger">Com não conformidade</span>}
      </p>
    </li>
  )
}

function ChecklistSection({ section, flaggedCodes }: { section: ReviewSection; flaggedCodes: ReadonlySet<string> }) {
  return (
    <div className={`${CARD} overflow-hidden`}>
      <h3 className="border-b border-neutral-200 bg-neutral-100 px-6 py-4 text-lg font-semibold text-neutral-900">
        {section.order}. {section.title}
      </h3>
      <ul className="divide-y divide-neutral-200">
        {section.items.map((item) => (
          <ChecklistItem key={item.id} item={item} flagged={flaggedCodes.has(item.code)} />
        ))}
      </ul>
    </div>
  )
}

export function ChecklistStructure({ review }: { review: InspectionReview }) {
  const flaggedCodes = new Set(review.nonConformities?.flatMap((finding) => finding.itemCode ?? []))

  return (
    <section aria-labelledby="checklist-title" className="flex flex-col gap-6">
      <h2 id="checklist-title" className="flex items-center gap-3 border-b border-neutral-200 pb-3 text-2xl font-semibold text-neutral-900">
        <IoListOutline aria-hidden className="size-7" />
        Checklist da inspeção
      </h2>
      {review.sections.map((section) => (
        <ChecklistSection key={section.order} section={section} flaggedCodes={flaggedCodes} />
      ))}
    </section>
  )
}

export function ReviewHistory({ review }: { review: InspectionReview }) {
  return (
    <section aria-labelledby="review-history-title" className={`${CARD} flex flex-col gap-4 p-6`}>
      <h2 id="review-history-title" className="text-lg font-semibold text-neutral-900">
        Histórico de revisões
      </h2>
      {review.reviews === null ? (
        <p className="text-sm text-neutral-600">Histórico de revisões indisponível para o seu perfil: só o Supervisor o consulta.</p>
      ) : review.reviews.length === 0 ? (
        <p className="text-sm text-neutral-600">Primeira rodada de revisão. Ainda não há decisões anteriores.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {review.reviews.map((record) => (
            <li key={record.id} className="flex flex-col gap-1 border-l-2 border-neutral-200 pl-4 text-sm">
              <span className="font-medium text-neutral-900">
                Rodada {record.cycle} · {record.decision === 'APPROVED' ? 'Aprovada' : 'Reprovada'} por{' '}
                {record.reviewerName ?? 'supervisor'}
              </span>
              <span className="text-neutral-500">{formatDateTime(record.reviewedAt)}</span>
              {record.reason && <span className="text-neutral-700">Motivo: {record.reason}</span>}
              {record.comments && <span className="text-neutral-700">{record.comments}</span>}
              {record.itemCodes.length > 0 && (
                <span className="text-neutral-700">Itens a corrigir: {record.itemCodes.join(', ')}</span>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
