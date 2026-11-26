import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  IoArrowBack,
  IoBanOutline,
  IoCalendarOutline,
  IoGitCommitOutline,
  IoLockClosedOutline,
  IoTimeOutline,
} from 'react-icons/io5'

import {
  INSPECTION_STATUS_LABELS,
  INSPECTION_STATUS_TONES,
  inspectionReference,
  type InspectionStatus,
} from '@/lib/domain/inspection'
import { historyActionLabel, type InspectionDetail } from '@/lib/domain/inspection-detail'
import type { InspectionHistoryEvent } from '@/lib/domain/inspection-history'
import { dueLabel } from '@/lib/domain/inspection-list'
import { INSPECTION_PRIORITY_LABELS, type InspectionPriority } from '@/lib/domain/inspection-scheduling'
import type { StatusTone } from '@/lib/domain/page'
import { formatDateTime, orDash } from '@/lib/format'

const CARD = 'rounded-card border border-neutral-200 bg-neutral-0'
const LABEL = 'text-xs font-medium tracking-wider text-neutral-700 uppercase'

const STATUS_PILL: Record<StatusTone, string> = {
  success: 'border-success/30 bg-success-soft text-success',
  neutral: 'border-neutral-200 bg-neutral-100 text-neutral-700',
  warning: 'border-warning/30 bg-warning-soft text-warning',
  danger: 'border-danger/30 bg-danger-soft text-danger',
  info: 'border-info/30 bg-info-soft text-info',
}

const PRIORITY_PILL: Record<InspectionPriority, string> = {
  CRITICAL: 'bg-danger text-neutral-0',
  HIGH: 'border border-warning/30 bg-warning-soft text-warning',
  MEDIUM: 'border border-info/30 bg-info-soft text-info',
  LOW: 'border border-neutral-200 bg-neutral-100 text-neutral-700',
}

function Detail({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${wide ? 'sm:col-span-2 lg:col-span-3' : ''}`}>
      <dt className={LABEL}>{label}</dt>
      <dd className="text-base break-words text-neutral-900">{children}</dd>
    </div>
  )
}

function SectionTitle({ id, icon, children, aside }: { id: string; icon: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id={id} className="flex items-center gap-3 text-lg font-semibold text-neutral-900">
        <span aria-hidden className="text-neutral-600 [&>svg]:size-6">
          {icon}
        </span>
        {children}
      </h2>
      {aside}
    </div>
  )
}

export function DetailHeader({ inspection, actions }: { inspection: InspectionDetail; actions: ReactNode }) {
  return (
    <header className="-mx-4 -mt-6 flex flex-col gap-4 border-b border-neutral-200 bg-neutral-0 px-4 py-5 sm:-mx-6 sm:px-6">
      <Link href="/inspections" className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline">
        <IoArrowBack aria-hidden className="size-4" />
        Inspeções
      </Link>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-950">{inspectionReference(inspection.id)}</h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-field border px-2.5 py-1 text-sm font-medium tracking-wide uppercase ${
                STATUS_PILL[INSPECTION_STATUS_TONES[inspection.status]]
              }`}
            >
              <span aria-hidden className="size-2 rounded-full bg-current" />
              <span className="sr-only">Estado: </span>
              {INSPECTION_STATUS_LABELS[inspection.status]}
            </span>
          </div>
          <p className="text-base text-neutral-700">{inspection.title}</p>
        </div>
        {actions}
      </div>
    </header>
  )
}

export function CancellationNotice({ inspection }: { inspection: InspectionDetail }) {
  if (inspection.status !== 'CANCELED') return null

  return (
    <section aria-labelledby="cancellation-title" className="flex items-start gap-4 rounded-card border border-neutral-300 bg-neutral-100 px-6 py-5">
      <IoBanOutline aria-hidden className="mt-0.5 size-7 shrink-0 text-neutral-600" />
      <div className="flex flex-col gap-1 text-neutral-800">
        <h2 id="cancellation-title" className="text-lg font-semibold text-neutral-900">
          Inspeção cancelada
        </h2>
        <p>
          Por {orDash(inspection.canceledByName)} em {formatDateTime(inspection.canceledAt)}.
        </p>
        {inspection.canceledReason && (
          <p>
            <span className="font-medium">Motivo: </span>
            {inspection.canceledReason}
          </p>
        )}
      </div>
    </section>
  )
}

export function PlanningDetails({
  inspection,
  today,
  editAction,
  lockedReason,
}: {
  inspection: InspectionDetail
  today: string
  editAction: ReactNode
  lockedReason: string | null
}) {
  const due = dueLabel(inspection, today)

  return (
    <section aria-labelledby="planning-title" className={`${CARD} flex flex-col gap-6 p-6`}>
      <SectionTitle id="planning-title" icon={<IoCalendarOutline />} aside={editAction}>
        Planejamento
      </SectionTitle>
      <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Detail label="Cliente">{inspection.clientName}</Detail>
        <Detail label="Local">{inspection.siteName}</Detail>
        <Detail label="Equipamento">{inspection.equipmentId === null ? 'Inspeção geral do local' : orDash(inspection.equipmentName)}</Detail>
        <Detail label="Técnico">
          {inspection.technicianId === null ? (
            <span className="text-neutral-600 italic">Não atribuído</span>
          ) : (
            orDash(inspection.technicianName)
          )}
        </Detail>
        <Detail label="Supervisor">{orDash(inspection.supervisorName)}</Detail>
        <Detail label="Prioridade">
          <span className={`inline-flex rounded px-2.5 py-1 text-xs font-bold tracking-wide uppercase ${PRIORITY_PILL[inspection.priority]}`}>
            {INSPECTION_PRIORITY_LABELS[inspection.priority]}
          </span>
        </Detail>
        <Detail label="Prazo">
          <span className="flex flex-col">
            {formatDateTime(inspection.scheduledFor)}
            {due && (
              <span className={`text-sm ${due.startsWith('Atrasado') ? 'font-medium text-danger' : 'text-neutral-600'}`}>
                {due}
              </span>
            )}
          </span>
        </Detail>
        <Detail label="Modelo">
          {inspection.templateTitle} · v{inspection.templateVersionNumber}
        </Detail>
        <Detail label="Criada em">{formatDateTime(inspection.createdAt)}</Detail>
        <Detail label="Instruções" wide>
          {inspection.instructions ?? <span className="text-neutral-600">Sem instruções adicionais.</span>}
        </Detail>
      </dl>
      {lockedReason && (
        <p className="flex items-center gap-2 border-t border-neutral-200 pt-4 text-sm text-neutral-600">
          <IoLockClosedOutline aria-hidden className="size-4 shrink-0" />
          {lockedReason}
        </p>
      )}
    </section>
  )
}

function TimePair({ device, server }: { device: string | null; server: string | null }) {
  return (
    <>
      <td className="py-3 pr-4 text-neutral-900">{formatDateTime(device)}</td>
      <td className="py-3 text-neutral-900">
        {server ? formatDateTime(server) : device ? <span className="text-warning">Aguardando sincronização</span> : '—'}
      </td>
    </>
  )
}

const NOT_STARTED_STATUSES: readonly InspectionStatus[] = ['DRAFT', 'ASSIGNED']

function missingExecutionMessage(status: InspectionStatus): string {
  if (status === 'CANCELED') return 'A inspeção foi cancelada antes de o técnico iniciar a execução.'
  if (NOT_STARTED_STATUSES.includes(status)) {
    return 'O técnico ainda não iniciou a execução. Os horários aparecem aqui depois da sincronização.'
  }
  return 'O histórico não registra os horários desta execução.'
}

export function ExecutionDetails({ inspection }: { inspection: InspectionDetail }) {
  const started = inspection.startedAtDevice !== null

  return (
    <section aria-labelledby="execution-title" className={`${CARD} flex flex-col gap-6 p-6`}>
      <SectionTitle id="execution-title" icon={<IoTimeOutline />}>
        Execução
      </SectionTitle>

      <dl>
        <Detail label="Itens do checklist">{inspection.applicableItems}</Detail>
      </dl>

      {started ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[20rem] text-left text-sm">
            <caption className="sr-only">Horários do dispositivo e do servidor</caption>
            <thead>
              <tr className="border-b border-neutral-200">
                <th scope="col" className={`${LABEL} py-2 pr-4`}>
                  Etapa
                </th>
                <th scope="col" className={`${LABEL} py-2 pr-4`}>
                  Dispositivo
                </th>
                <th scope="col" className={`${LABEL} py-2`}>
                  Servidor
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              <tr>
                <th scope="row" className="py-3 pr-4 font-medium text-neutral-700">
                  Início
                </th>
                <TimePair device={inspection.startedAtDevice} server={inspection.startedAtServer} />
              </tr>
              <tr>
                <th scope="row" className="py-3 pr-4 font-medium text-neutral-700">
                  Conclusão
                </th>
                <TimePair device={inspection.completedAtDevice} server={inspection.submittedAtServer} />
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-neutral-600">{missingExecutionMessage(inspection.status)}</p>
      )}
    </section>
  )
}

export function StatusHistory({
  events,
  inspectionId,
}: {
  events: readonly InspectionHistoryEvent[]
  inspectionId: string
}) {
  return (
    <section aria-labelledby="history-title" className={`${CARD} flex flex-col gap-5 p-6`}>
      <SectionTitle
        id="history-title"
        icon={<IoGitCommitOutline />}
        aside={
          <Link
            href={`/audit?period=all&inspectionId=${inspectionId}`}
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            Ver na auditoria
          </Link>
        }
      >
        Linha do tempo
      </SectionTitle>
      {events.length === 0 ? (
        <p className="text-sm text-neutral-600">Nenhum evento registrado.</p>
      ) : (
        <ol className="relative flex flex-col gap-5 border-l-2 border-neutral-200 pl-6">
          {events.map((event) => (
            <li key={event.id} className="relative flex flex-col gap-1 text-sm">
              <span
                aria-hidden
                className={`absolute top-1 -left-[31px] size-3.5 rounded-full border-2 border-neutral-0 ${
                  event.newStatus ? STATUS_DOT[INSPECTION_STATUS_TONES[event.newStatus]] : 'bg-neutral-400'
                }`}
              />
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-semibold text-neutral-900">{historyActionLabel(event.action)}</span>
                {event.previousStatus && event.newStatus && (
                  <span className="text-xs text-neutral-600">
                    {INSPECTION_STATUS_LABELS[event.previousStatus]} → {INSPECTION_STATUS_LABELS[event.newStatus]}
                  </span>
                )}
              </span>
              <span className="text-neutral-700">
                {event.actorName ?? 'Sistema'} · <time dateTime={event.occurredAt}>{formatDateTime(event.occurredAt)}</time>
                {event.deviceOccurredAt && (
                  <span className="text-neutral-600"> (no dispositivo: {formatDateTime(event.deviceOccurredAt)})</span>
                )}
              </span>
              {event.note && <span className="text-neutral-700">{event.note}</span>}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

const STATUS_DOT: Record<StatusTone, string> = {
  success: 'bg-success',
  neutral: 'bg-neutral-500',
  warning: 'bg-tertiary-500',
  danger: 'bg-danger',
  info: 'bg-info',
}
