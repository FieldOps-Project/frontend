import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  MdBlock,
  MdCheckCircleOutline,
  MdEdit,
  MdHighlightOff,
  MdOutlineCameraAlt,
  MdOutlineInfo,
  MdOutlineReportProblem,
  MdOutlineSmartToy,
  MdOutlineSync,
} from 'react-icons/md'

import { auditActionLabel, auditActionTone, entityHref, type AuditEvent } from '@/lib/domain/audit'
import { dayInSaoPaulo, initials } from '@/lib/domain/inspection-list'
import type { StatusTone } from '@/lib/domain/page'
import { formatDateTimeSeconds } from '@/lib/format'

/** Cabecalho pode quebrar ("Entidade / afetada", como no Stitch): quem define a largura e o conteudo. */
const HEAD = 'px-4 py-4 text-left text-[13px] leading-snug font-medium tracking-wider text-neutral-700 uppercase'
const CELL = 'px-4 py-4 align-middle'

/** Selo da acao como no Stitch: fundo suave, icone e o rotulo escrito. */
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
  if (/BLOCKED|REMOVED/.test(action)) return <MdBlock {...props} />
  if (/APPROVED|PUBLISHED/.test(action)) return <MdCheckCircleOutline {...props} />
  if (/UPDATED/.test(action)) return <MdEdit {...props} />
  if (/EVIDENCE/.test(action)) return <MdOutlineCameraAlt {...props} />
  if (/NON_CONFORMITY/.test(action)) return <MdOutlineReportProblem {...props} />
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
      className={`inline-flex max-w-40 items-center gap-1.5 rounded px-2.5 py-1 text-left text-sm leading-snug font-medium ${ACTION_BADGE[auditActionTone(action)]}`}
    >
      {actionIcon(action)}
      {auditActionLabel(action)}
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
        <span className="truncate">Sistema (Auto)</span>
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

/** Registro em cima e o detalhe (como `item 1.4`) embaixo, para a coluna nao alargar. */
function Entity({ event }: { event: AuditEvent }) {
  const href = entityHref(event)
  const [main, ...rest] = event.entityLabel.split(' · ')
  const label = (
    <>
      <span className="truncate">{main}</span>
      {rest.length > 0 && <span className="truncate text-sm font-normal text-neutral-600">{rest.join(' · ')}</span>}
    </>
  )
  return href ? (
    <Link href={href} className="flex max-w-full flex-col font-medium text-brand-700 hover:underline">
      {label}
    </Link>
  ) : (
    <span className="flex max-w-full flex-col text-neutral-900">{label}</span>
  )
}

/** So a hora quando o dispositivo registrou no mesmo dia do servidor; a data inteira quando nao. */
function deviceTime(device: string, server: string): string {
  const full = formatDateTimeSeconds(device)
  return dayInSaoPaulo(device) === dayInSaoPaulo(server) ? (full.split(', ')[1] ?? full) : full
}

/** Horario do servidor; o do dispositivo aparece embaixo quando a acao veio do aplicativo (RN-074). */
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

/**
 * Eventos de auditoria, no desenho do Stitch "Auditoria de Sistema". Somente
 * leitura (RN-088): nenhuma linha oferece editar ou excluir.
 *
 * A tabela tem layout fixo: cada coluna tem a largura do seu conteudo e a
 * descricao fica com a sobra, cortando com reticencias -- nada passa da borda.
 * Quem decide entre tabela e cartoes e a largura do proprio quadro (container
 * query, `@5xl` = 64rem), nao a da janela: o menu lateral e o zoom do navegador
 * mudam o espaco real, e so o quadro sabe quanto sobrou.
 */
export function AuditTable({ events }: { events: readonly AuditEvent[] }) {
  return (
    <>
      <ul className="divide-y divide-neutral-200 @5xl:hidden">
        {events.map((event) => (
          <li key={event.id} className="flex flex-col gap-2.5 px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <ActionBadge action={event.action} />
              <span className="font-mono text-xs text-neutral-600">{event.code}</span>
            </div>
            <p className="text-sm text-neutral-800">{event.description}</p>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <Actor event={event} />
              <Entity event={event} />
            </div>
            <When event={event} />
          </li>
        ))}
      </ul>

      <div className="hidden @5xl:block">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-28" />
            <col className="w-52" />
            <col className="w-44" />
            <col className="w-48" />
            <col className="w-38" />
            <col />
          </colgroup>
          <thead className="border-b border-neutral-200 bg-neutral-100">
            <tr>
              <th scope="col" className={HEAD}>
                ID do evento
              </th>
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
                Entidade afetada
              </th>
              <th scope="col" className={HEAD}>
                Descrição
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-neutral-50">
                <td className={`${CELL} font-mono text-sm whitespace-nowrap text-neutral-700`}>{event.code}</td>
                <td className={CELL}>
                  <When event={event} />
                </td>
                <td className={CELL}>
                  <Actor event={event} />
                </td>
                <td className={CELL}>
                  <ActionBadge action={event.action} />
                </td>
                <td className={CELL}>
                  <Entity event={event} />
                </td>
                <td className={CELL}>
                  <span title={event.description} className="block truncate text-neutral-800">
                    {event.description}
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
