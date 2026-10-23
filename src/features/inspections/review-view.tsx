import type { ReactNode } from 'react'
import {
  IoAlertCircleOutline,
  IoCameraOutline,
  IoCheckbox,
  IoCheckmark,
  IoClose,
  IoConstructOutline,
  IoDocumentTextOutline,
  IoLockClosedOutline,
  IoPersonOutline,
  IoPieChartOutline,
  IoRemove,
  IoTimeOutline,
} from 'react-icons/io5'

import { INSPECTION_STATUS_LABELS } from '@/lib/domain/inspection'
import {
  CONFORMITY_LABELS,
  SEVERITY_LABELS,
  executionDuration,
  isAnswered,
  reviewItems,
  type Conformity,
  type InspectionReview,
  type ReviewItem,
  type ReviewNonConformity,
  type Severity,
} from '@/lib/domain/inspection-review'
import { formatDateTime } from '@/lib/format'

const CARD = 'rounded-card border border-neutral-200 bg-neutral-0'
const LABEL = 'text-xs font-medium tracking-wider text-neutral-700 uppercase'

const SEVERITY_BADGE: Record<Severity, string> = {
  CRITICAL: 'bg-danger text-neutral-0',
  HIGH: 'border border-warning/30 bg-warning-soft text-warning',
  MEDIUM: 'border border-warning/30 bg-warning-soft text-warning',
  LOW: 'border border-neutral-200 bg-neutral-100 text-neutral-700',
}

const SEVERITY_DOT: Record<Severity, string> = {
  CRITICAL: 'bg-danger',
  HIGH: 'bg-tertiary-500',
  MEDIUM: 'bg-tertiary-500',
  LOW: 'bg-neutral-400',
}

const CONFORMITY_CHIP: Record<Conformity, { className: string; icon: ReactNode }> = {
  CONFORMING: {
    className: 'border-success/30 bg-success-soft text-success',
    icon: <IoCheckmark aria-hidden className="size-5" />,
  },
  NON_CONFORMING: {
    className: 'border-danger/30 bg-danger-soft text-danger',
    icon: <IoClose aria-hidden className="size-5" />,
  },
  NOT_APPLICABLE: {
    className: 'border-neutral-200 bg-neutral-100 text-neutral-700',
    icon: <IoRemove aria-hidden className="size-5" />,
  },
}

function SeverityBadge({ severity, size = 'md' }: { severity: Severity; size?: 'sm' | 'md' }) {
  return (
    <span
      className={`inline-flex items-center rounded font-bold tracking-wide uppercase ${SEVERITY_BADGE[severity]} ${
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      }`}
    >
      {SEVERITY_LABELS[severity]}
    </span>
  )
}

/** Cabecalho: codigo, situacao, tecnico e equipamento; as acoes ficam a direita. */
export function ReviewHeader({ review, actions }: { review: InspectionReview; actions: ReactNode }) {
  return (
    <header className="-mx-4 -mt-6 flex flex-col gap-4 border-b border-neutral-200 bg-neutral-0 px-4 py-5 sm:-mx-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-950">{review.code}</h1>
          <span className="inline-flex items-center gap-1.5 rounded-field border border-warning/30 bg-warning-soft px-2.5 py-1 text-sm font-medium tracking-wide text-warning uppercase">
            <span aria-hidden className="size-2 rounded-full bg-current" />
            {INSPECTION_STATUS_LABELS[review.status]}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-base text-neutral-700">
          <span className="flex items-center gap-2">
            <IoPersonOutline aria-hidden className="size-5" />
            <span className="sr-only">Técnico:</span>
            {review.technicianName}
          </span>
          <span className="flex items-center gap-2">
            <IoConstructOutline aria-hidden className="size-5" />
            <span className="sr-only">Equipamento:</span>
            {review.equipmentName} - {review.siteName}
          </span>
        </div>
      </div>
      {actions}
    </header>
  )
}

/** Faixa de bloqueio: o supervisor nao altera a resposta do tecnico (RN-084, documento 14.11). */
export function LockedNotice() {
  return (
    <div className="flex items-start gap-4 rounded-card border border-brand-200 bg-brand-50 px-6 py-5 text-brand-700">
      <IoLockClosedOutline aria-hidden className="mt-0.5 size-7 shrink-0" />
      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold">Bloqueado para edição</p>
        <p>As respostas do técnico são apenas leitura durante a fase de revisão.</p>
      </div>
    </div>
  )
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <dt className={LABEL}>{label}</dt>
      <dd className="text-base text-neutral-900">{children}</dd>
    </div>
  )
}

/** Horarios do dispositivo e do servidor lado a lado (RN-074) e localizacao de inicio (RN-061/062). */
export function ExecutionDetails({ review }: { review: InspectionReview }) {
  const duration = executionDuration(review)
  const location = review.startLocation

  return (
    <section aria-labelledby="execution-title" className={`${CARD} flex flex-col gap-6 p-6`}>
      <h2 id="execution-title" className="flex items-center gap-3 text-lg font-semibold text-neutral-900">
        <IoTimeOutline aria-hidden className="size-6" />
        Detalhes da execução
      </h2>
      <dl className="grid gap-6 sm:grid-cols-2">
        <Detail label="Horário do dispositivo (início)">
          <span className="flex items-center gap-2">
            {formatDateTime(review.startedAtDevice)}
            {review.submittedAtServer && (
              <IoCheckbox aria-label="Sincronizado com o servidor" className="size-5 text-success" />
            )}
          </span>
        </Detail>
        <Detail label="Localização GPS (início)">
          {location ? (
            <span className="inline-flex flex-col items-start gap-1">
              <code className="rounded bg-neutral-100 px-2.5 py-1 font-mono text-sm text-neutral-900">
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </code>
              {location.accuracy !== null && (
                <span className="text-xs text-neutral-500">Precisão de {location.accuracy} m</span>
              )}
            </span>
          ) : (
            '—'
          )}
        </Detail>
        <Detail label="Horário do servidor (sincronização)">{formatDateTime(review.submittedAtServer)}</Detail>
        <Detail label="Duração">{duration ?? '—'}</Detail>
      </dl>
    </section>
  )
}

/** Progresso e resultado: itens verificados e nao conformidades. */
export function InspectionSummary({ review }: { review: InspectionReview }) {
  const items = reviewItems(review)
  const answered = items.filter(isAnswered).length
  const percent = items.length === 0 ? 0 : Math.round((answered / items.length) * 100)

  return (
    <section aria-labelledby="summary-title" className={`${CARD} flex flex-col gap-5 p-6`}>
      <h2 id="summary-title" className="flex items-center gap-3 text-lg font-semibold text-neutral-900">
        <IoPieChartOutline aria-hidden className="size-6" />
        Resumo da inspeção
      </h2>
      <div className="flex flex-col gap-3">
        <div className="flex items-end justify-between">
          <span className="text-base text-neutral-700">Conclusão</span>
          <span className="text-2xl font-semibold text-brand-700">{percent}%</span>
        </div>
        <div
          role="progressbar"
          aria-label="Conclusão do checklist"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="h-2 overflow-hidden rounded-full bg-neutral-100"
        >
          <div className="h-full rounded-full bg-brand-700" style={{ width: `${percent}%` }} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5 rounded border border-neutral-200 bg-neutral-100 p-4">
          <span className="text-sm text-neutral-700">Itens verificados</span>
          <span className="text-2xl font-semibold text-neutral-900">
            {answered}
            <span className="text-base font-normal text-neutral-600">/{items.length}</span>
          </span>
        </div>
        <div className="flex flex-col gap-1.5 rounded border border-danger/30 bg-danger-soft p-4 text-danger">
          <span className="text-sm">Não conformidades</span>
          <span className="text-2xl font-semibold">{review.nonConformities.length}</span>
        </div>
      </div>
    </section>
  )
}

/** Nao conformidades com criticidade (RN-054); cada linha leva ao item do checklist. */
export function NonConformitiesPanel({ nonConformities }: { nonConformities: readonly ReviewNonConformity[] }) {
  if (nonConformities.length === 0) {
    return null
  }

  const count = nonConformities.length

  return (
    <section aria-labelledby="nc-title" className="overflow-hidden rounded-card border border-danger/30 bg-danger-soft/40">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-danger/20 bg-danger-soft/70 px-6 py-4">
        <h2 id="nc-title" className="flex items-center gap-3 text-lg font-semibold text-danger">
          <IoAlertCircleOutline aria-hidden className="size-6" />
          Não conformidades encontradas
        </h2>
        <span className="rounded-full border border-danger/30 bg-danger-soft px-3 py-1 text-sm text-danger">
          {count} {count === 1 ? 'item exige revisão' : 'itens exigem revisão'}
        </span>
      </div>
      <ul className="divide-y divide-danger/15">
        {nonConformities.map((nc) => (
          <li key={nc.id}>
            <a
              href={nc.itemId ? `#${nc.itemId}` : undefined}
              className="flex items-center gap-4 px-6 py-4 text-base text-neutral-900 hover:bg-danger-soft/60"
            >
              <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${SEVERITY_DOT[nc.severity]}`} />
              <span className="min-w-0 flex-1">
                {nc.itemCode && <span>{nc.itemCode} </span>}
                {nc.title}
              </span>
              <SeverityBadge severity={nc.severity} />
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

function ResponseChip({ item }: { item: ReviewItem }) {
  if (item.conformity) {
    const chip = CONFORMITY_CHIP[item.conformity]
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-field border px-4 py-2 text-base font-medium ${chip.className}`}
      >
        {chip.icon}
        {CONFORMITY_LABELS[item.conformity]}
      </span>
    )
  }

  if (item.displayValue) {
    return (
      <span className="inline-flex items-center rounded-field border border-neutral-200 bg-neutral-0 px-4 py-2 font-mono text-base text-neutral-900">
        {item.displayValue}
      </span>
    )
  }

  return <span className="text-sm text-neutral-500">Sem resposta</span>
}

function ChecklistItem({ item, nonConformity }: { item: ReviewItem; nonConformity: ReviewNonConformity | undefined }) {
  return (
    <li
      id={item.id}
      className={`flex scroll-mt-24 flex-col gap-4 px-6 py-5 ${nonConformity ? 'border-l-4 border-danger' : ''}`}
    >
      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] md:items-start">
        <div className="flex flex-col items-start gap-2">
          <p className="text-base text-neutral-900">
            {item.code} {item.title}
          </p>
          {nonConformity ? (
            <SeverityBadge severity={nonConformity.severity} size="sm" />
          ) : (
            <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">
              {item.required ? 'Obrigatório' : 'Opcional'}
            </span>
          )}
        </div>
        <div>
          <ResponseChip item={item} />
        </div>
        <IoLockClosedOutline aria-label="Resposta do técnico, somente leitura" className="size-5 text-neutral-400" />
      </div>

      {(item.observation || item.photos.length > 0) && (
        <div className="flex flex-col gap-3 rounded-field bg-neutral-50 p-4 md:ml-0">
          {item.observation && (
            <p className="flex items-start gap-2 text-sm text-neutral-700">
              <IoDocumentTextOutline aria-hidden className="mt-0.5 size-4 shrink-0" />
              <span>
                <span className="font-medium text-neutral-900">Observação do técnico: </span>
                {item.observation}
              </span>
            </p>
          )}
          {item.photos.length > 0 && (
            <ul aria-label="Fotografias do item" className="flex flex-wrap gap-3">
              {item.photos.map((photo, index) => (
                <li key={photo.id} className="flex w-36 flex-col gap-1.5">
                  <div className="grid aspect-[4/3] place-items-center rounded-field border border-neutral-200 bg-neutral-100 text-neutral-400">
                    <IoCameraOutline aria-hidden className="size-7" />
                  </div>
                  <span className="text-xs text-neutral-600">
                    {photo.description ?? `Foto ${index + 1}`} · {formatDateTime(photo.capturedAtDevice)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  )
}

/** Secoes do checklist com a resposta de cada item, somente leitura (RN-084). */
export function ChecklistResponses({ review }: { review: InspectionReview }) {
  const byItem = new Map(review.nonConformities.flatMap((nc) => (nc.itemId ? [[nc.itemId, nc] as const] : [])))

  return (
    <section aria-labelledby="checklist-title" className="flex flex-col gap-6">
      <h2 id="checklist-title" className="border-b border-neutral-200 pb-3 text-2xl font-semibold text-neutral-900">
        Respostas do checklist
      </h2>
      {review.sections.map((section) => (
        <div key={section.id} className={`${CARD} overflow-hidden`}>
          <h3 className="border-b border-neutral-200 bg-neutral-100 px-6 py-4 text-lg font-semibold text-neutral-900">
            {section.order}. {section.title}
          </h3>
          <ul className="divide-y divide-neutral-200">
            {section.items.map((item) => (
              <ChecklistItem key={item.id} item={item} nonConformity={byItem.get(item.id)} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}

/** Rodadas anteriores de revisao (documento 14.11), com motivo de cada reprovacao. */
export function ReviewHistory({ review }: { review: InspectionReview }) {
  return (
    <section aria-labelledby="history-title" className={`${CARD} flex flex-col gap-4 p-6`}>
      <h2 id="history-title" className="text-lg font-semibold text-neutral-900">
        Histórico de revisões
      </h2>
      {review.reviews.length === 0 ? (
        <p className="text-sm text-neutral-600">Primeira rodada de revisão. Ainda não há decisões anteriores.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {review.reviews.map((record) => (
            <li key={record.id} className="flex flex-col gap-1 border-l-2 border-neutral-200 pl-4 text-sm">
              <span className="font-medium text-neutral-900">
                Rodada {record.cycle} · {record.decision === 'APPROVED' ? 'Aprovada' : 'Reprovada'} por{' '}
                {record.reviewerName}
              </span>
              <span className="text-neutral-500">{formatDateTime(record.reviewedAt)}</span>
              {record.reason && <span className="text-neutral-700">Motivo: {record.reason}</span>}
              {record.comments && <span className="text-neutral-700">{record.comments}</span>}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
