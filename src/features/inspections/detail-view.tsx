import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  IoArrowBack,
  IoBanOutline,
  IoCalendarOutline,
  IoGitCommitOutline,
  IoLocationOutline,
  IoLockClosedOutline,
  IoTimeOutline,
} from 'react-icons/io5'

import { INSPECTION_STATUS_LABELS, INSPECTION_STATUS_TONES } from '@/lib/domain/inspection'
import { historyActionLabel, type InspectionDetail, type InspectionHistoryEvent } from '@/lib/domain/inspection-detail'
import { dueLabel, progressPercent } from '@/lib/domain/inspection-list'
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

/** Cabecalho: codigo, estado e titulo; as acoes permitidas no estado ficam a direita. */
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
            <h1 className="text-3xl font-bold tracking-tight text-neutral-950">{inspection.code}</h1>
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

/** Cancelamento registrado: quem, quando e por que (RN-029). */
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

/** Dados de planejamento (documento 14.9): o que foi agendado e para quem. */
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
        <Detail label="Equipamento">{inspection.equipmentName ?? 'Inspeção geral do local'}</Detail>
        <Detail label="Técnico">
          {inspection.technicianName ?? <span className="text-neutral-600 italic">Não atribuído</span>}
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

/**
 * Execucao: horarios do dispositivo e do servidor lado a lado (RN-074) -- e a
 * diferenca entre eles que explica o fluxo offline --, localizacao registrada
 * com precisao e horario (RN-061/062) e progresso (RN-040).
 */
export function ExecutionDetails({ inspection }: { inspection: InspectionDetail }) {
  const percent = progressPercent(inspection)
  const location = inspection.startLocation
  const started = inspection.startedAtDevice !== null

  return (
    <section aria-labelledby="execution-title" className={`${CARD} flex flex-col gap-6 p-6`}>
      <SectionTitle id="execution-title" icon={<IoTimeOutline />}>
        Execução
      </SectionTitle>

      <div className="flex flex-col gap-3">
        <div className="flex items-end justify-between">
          <span className="text-base text-neutral-700">Progresso</span>
          <span className="text-base text-neutral-900">
            <span className="text-2xl font-semibold text-brand-700">{percent}%</span>{' '}
            <span className="text-sm text-neutral-600">
              ({inspection.answeredItems}/{inspection.applicableItems} itens)
            </span>
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Progresso do checklist"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="h-2 overflow-hidden rounded-full bg-neutral-100"
        >
          <div className="h-full rounded-full bg-brand-700" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {started ? (
        <>
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

          <dl>
            <Detail label="Localização registrada (início)">
              {location ? (
                <span className="flex flex-col items-start gap-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <IoLocationOutline aria-hidden className="size-5 text-neutral-600" />
                    <code className="rounded bg-neutral-100 px-2.5 py-1 font-mono text-sm text-neutral-900">
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </code>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=17/${location.latitude}/${location.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-brand-700 hover:underline"
                    >
                      Ver no mapa<span className="sr-only"> (abre em nova aba)</span>
                    </a>
                  </span>
                  <span className="text-xs text-neutral-600">
                    {location.accuracy !== null ? `Precisão de ${location.accuracy} m · ` : 'Precisão não informada · '}
                    capturada em {formatDateTime(location.capturedAtDevice)}
                  </span>
                </span>
              ) : (
                <span className="text-neutral-600">O dispositivo não registrou localização.</span>
              )}
            </Detail>
          </dl>
        </>
      ) : (
        <p className="text-sm text-neutral-600">
          {inspection.status === 'CANCELED'
            ? 'A inspeção foi cancelada antes de o técnico iniciar a execução.'
            : 'O técnico ainda não iniciou a execução. Horários e localização aparecem aqui depois da sincronização.'}
        </p>
      )}
    </section>
  )
}

/** Historico de estados a partir da auditoria, como linha do tempo (documento 10.12.1). */
export function StatusHistory({ events }: { events: readonly InspectionHistoryEvent[] | null }) {
  return (
    <section aria-labelledby="history-title" className={`${CARD} flex flex-col gap-5 p-6`}>
      <SectionTitle id="history-title" icon={<IoGitCommitOutline />}>
        Histórico de estados
      </SectionTitle>
      {events === null ? (
        <p className="text-sm text-neutral-600">
          Histórico indisponível no momento: a API ainda não publica a auditoria desta inspeção.
        </p>
      ) : events.length === 0 ? (
        <p className="text-sm text-neutral-600">Nenhuma mudança de estado registrada.</p>
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
