import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  MdBlock,
  MdCheckCircleOutline,
  MdEdit,
  MdHighlightOff,
  MdOutlineCameraAlt,
  MdOutlineDescription,
  MdOutlineInfo,
  MdOutlineReportProblem,
  MdOutlineSmartToy,
  MdOutlineSync,
} from 'react-icons/md'

import { auditActionTone, auditEntityLabel, auditEventDetail, type AuditEvent } from '@/lib/domain/audit'
import { inspectionReference } from '@/lib/domain/inspection'
import { historyActionLabel } from '@/lib/domain/inspection-detail'
import { dayInSaoPaulo, initials } from '@/lib/domain/inspection-list'
import type { StatusTone } from '@/lib/domain/page'
import { formatDateTimeSeconds } from '@/lib/format'

const HEAD = 'px-4 py-4 text-left text-[13px] leading-snug font-medium tracking-wider text-neutral-700 uppercase'
const CELL = 'px-4 py-4 align-middle'

const ACTION_BADGE: Record<StatusTone, string> = {
  info: 'bg-brand-50 text-brand-800',
  danger: 'bg-danger-soft text-danger',
  neutral: 'bg-neutral-100 text-neutral-800',
  warning: 'bg-warning-soft text-warning',
  success: 'bg-success-soft text-success',
}

function actionIcon(action: string): ReactNode {
  const props = { 'aria-hidden': true, className: 'size-4 shrink-0' } as const
  if (/CANCELED|REJECTED/.test(action)) return <MdHighlightOff {...props} />
  if (/REMOVED/.test(action)) return <MdBlock {...props} />
  if (/APPROVED/.test(action)) return <MdCheckCircleOutline {...props} />
  if (/UPDATED/.test(action)) return <MdEdit {...props} />
  if (/EVIDENCE/.test(action)) return <MdOutlineCameraAlt {...props} />
  if (/NON_CONFORMITY/.test(action)) return <MdOutlineReportProblem {...props} />
  if (/REPORT/.test(action)) return <MdOutlineDescription {...props} />
  if (/SUBMITTED|COMPLETED/.test(action)) return <MdOutlineSync {...props} />
  return <MdOutlineInfo {...props} />
}

const AVATAR_TONES = ['bg-brand-100 text-brand-800', 'bg-tertiary-100 text-tertiary-700', 'bg-secondary-100 text-secondary-700']

function avatarTone(name: string): string {
  const sum = [...name].reduce((total, char) => total + char.charCodeAt(0), 0)
  return AVATAR_TONES[sum % AVATAR_TONES.length] as string
}

export function ActionBadge({ action }: { action: string }) {
  return (
    <span
      className={`inline-flex max-w-44 items-center gap-1.5 rounded px-2.5 py-1 text-left text-sm leading-snug font-medium ${ACTION_BADGE[auditActionTone(action)]}`}
    >
      {actionIcon(action)}
      {historyActionLabel(action)}
    </span>
  )
}

function Actor({ event }: { event: AuditEvent }) {
  if (!event.actorName) {
    return (
      <span className="flex min-w-0 items-center gap-2.5 text-neutral-900">
        <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-700">
          <MdOutlineSmartToy className="size-5" />
        </span>
        <span className="truncate">Sistema</span>
      </span>
    )
  }
  return (
    <span className="flex min-w-0 items-center gap-2.5 text-neutral-900">
      <span aria-hidden className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold ${avatarTone(event.actorName)}`}>
        {initials(event.actorName)}
      </span>
      <span className="truncate" title={event.actorName}>
        {event.actorName}
      </span>
    </span>
  )
}

function InspectionLink({ event }: { event: AuditEvent }) {
  return (
    <Link href={`/audit?inspectionId=${event.inspectionId}`} className="flex max-w-full flex-col font-medium text-brand-700 hover:underline">
      <span className="truncate">{inspectionReference(event.inspectionId)}</span>
      <span className="truncate text-sm font-normal text-neutral-600" title={event.inspectionTitle}>
        {event.inspectionTitle}
      </span>
    </Link>
  )
}

function deviceTime(device: string, server: string): string {
  const full = formatDateTimeSeconds(device)
  return dayInSaoPaulo(device) === dayInSaoPaulo(server) ? (full.split(', ')[1] ?? full) : full
}

function When({ event }: { event: AuditEvent }) {
  return (
    <span className="flex flex-col gap-0.5">
      <time dateTime={event.occurredAt} className="whitespace-nowrap text-neutral-900">
        {formatDateTimeSeconds(event.occurredAt)}
      </time>
      {event.deviceOccurredAt && (
        <span className="text-xs whitespace-nowrap text-neutral-600">
          No dispositivo: <time dateTime={event.deviceOccurredAt}>{deviceTime(event.deviceOccurredAt, event.occurredAt)}</time>
        </span>
      )}
    </span>
  )
}

export function AuditTable({ events, showInspection }: { events: readonly AuditEvent[]; showInspection: boolean }) {
  return (
    <>
      <ul className="divide-y divide-neutral-200 xl:hidden">
        {events.map((event) => (
          <li key={event.id} className="flex flex-col gap-2.5 px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <ActionBadge action={event.action} />
              <span className="text-sm text-neutral-700">{auditEntityLabel(event.entityType)}</span>
            </div>
            {auditEventDetail(event) && <p className="text-sm text-neutral-800">{auditEventDetail(event)}</p>}
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <Actor event={event} />
              {showInspection && <InspectionLink event={event} />}
            </div>
            <When event={event} />
          </li>
        ))}
      </ul>

      <div className="hidden xl:block">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-48" />
            <col className="w-44" />
            <col className="w-52" />
            <col className="w-40" />
            {showInspection && <col className="w-52" />}
            <col />
          </colgroup>
          <thead className="border-b border-neutral-200 bg-neutral-100">
            <tr>
              <th scope="col" className={HEAD}>
                Data/hora
              </th>
              <th scope="col" className={HEAD}>
                Usuário
              </th>
              <th scope="col" className={HEAD}>
                Ação
              </th>
              <th scope="col" className={HEAD}>
                Registro afetado
              </th>
              {showInspection && (
                <th scope="col" className={HEAD}>
                  Inspeção
                </th>
              )}
              <th scope="col" className={HEAD}>
                Detalhe
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-surface-hover">
                <td className={CELL}>
                  <When event={event} />
                </td>
                <td className={CELL}>
                  <Actor event={event} />
                </td>
                <td className={CELL}>
                  <ActionBadge action={event.action} />
                </td>
                <td className={`${CELL} text-neutral-900`}>{auditEntityLabel(event.entityType)}</td>
                {showInspection && (
                  <td className={CELL}>
                    <InspectionLink event={event} />
                  </td>
                )}
                <td className={CELL}>
                  <span title={auditEventDetail(event) ?? undefined} className="block truncate text-neutral-800">
                    {auditEventDetail(event) ?? '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
