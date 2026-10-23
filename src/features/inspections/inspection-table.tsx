import Link from 'next/link'
import { IoArrowForward, IoLocationOutline, IoPersonAddOutline, IoWarningOutline } from 'react-icons/io5'

import { StatusBadge } from '@/components/ui/status-badge'
import { INSPECTION_STATUS_LABELS, INSPECTION_STATUS_TONES } from '@/lib/domain/inspection'
import {
  dayInSaoPaulo,
  dueLabel,
  initials,
  isAwaitingReview,
  isOverdue,
  progressPercent,
  type InspectionListItem,
} from '@/lib/domain/inspection-list'
import { INSPECTION_PRIORITY_LABELS, type InspectionPriority } from '@/lib/domain/inspection-scheduling'
import { formatDate, formatDateTime } from '@/lib/format'

const HEAD = 'px-5 py-4 text-left text-sm font-semibold tracking-wider text-neutral-700 uppercase'
const CELL = 'px-5 py-4 align-middle'

const PRIORITY_BADGE: Record<InspectionPriority, string> = {
  CRITICAL: 'bg-danger text-neutral-0 ring-2 ring-danger/30',
  HIGH: 'bg-danger text-neutral-0',
  MEDIUM: 'border border-brand-200 bg-brand-100 text-brand-800',
  LOW: 'border border-neutral-300 bg-neutral-200 text-neutral-700',
}

const AVATAR_TONES = ['bg-brand-100 text-brand-800', 'bg-tertiary-100 text-tertiary-700', 'bg-secondary-100 text-secondary-700']

function avatarTone(name: string): string {
  const sum = [...name].reduce((total, char) => total + char.charCodeAt(0), 0)
  return AVATAR_TONES[sum % AVATAR_TONES.length] as string
}

function reviewHref(item: InspectionListItem): string {
  return `/inspections/${item.id}/review`
}

function Technician({ item }: { item: InspectionListItem }) {
  if (!item.technicianName) {
    return (
      <span className="flex items-center gap-2.5 text-neutral-600 italic">
        <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full border border-dashed border-neutral-400">
          <IoPersonAddOutline className="size-4" />
        </span>
        Não atribuído
      </span>
    )
  }

  return (
    <span className="flex items-center gap-2.5 text-neutral-900">
      <span
        aria-hidden
        className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold ${avatarTone(item.technicianName)}`}
      >
        {initials(item.technicianName)}
      </span>
      {item.technicianName}
    </span>
  )
}

function Progress({ item }: { item: InspectionListItem }) {
  const percent = progressPercent(item)
  return (
    <div className="flex min-w-24 flex-col gap-1.5">
      <span className="text-sm text-neutral-900">
        {item.answeredItems}/{item.applicableItems} <span className="text-neutral-500">({percent}%)</span>
      </span>
      <span
        role="progressbar"
        aria-label={`Progresso de ${item.code}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-1.5 overflow-hidden rounded-full bg-neutral-100"
      >
        <span className="block h-full rounded-full bg-brand-700" style={{ width: `${percent}%` }} />
      </span>
    </div>
  )
}

function PlannedDate({ item, today }: { item: InspectionListItem; today: string }) {
  const late = isOverdue(item, today)
  const label = dueLabel(item, today)

  return (
    <div className={`flex flex-col gap-1 ${late ? 'text-danger' : 'text-neutral-900'}`}>
      <span className="flex items-center gap-1.5 text-base whitespace-nowrap">
        {late && <IoWarningOutline aria-hidden className="size-5" />}
        {formatDate(dayInSaoPaulo(item.scheduledFor))}
      </span>
      {label && <span className={`text-xs ${late ? '' : 'text-neutral-600'}`}>{label}</span>}
    </div>
  )
}

/**
 * Tabela do acompanhamento (documento 14.10): identificador, cliente e local,
 * equipamento, tecnico, prioridade, estado com ultima atualizacao, progresso e
 * data prevista com atraso. Estado, prioridade e atraso aparecem em texto, nao
 * so em cor. Quem aguarda revisao leva direto a tela de revisao.
 */
export function InspectionTable({ items, today }: { items: readonly InspectionListItem[]; today: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-base">
        <caption className="sr-only">Inspeções</caption>
        <thead className="border-b border-neutral-200">
          <tr>
            <th scope="col" className={HEAD}>
              ID / Título
            </th>
            <th scope="col" className={HEAD}>
              Cliente &amp; Local
            </th>
            <th scope="col" className={`${HEAD} hidden 2xl:table-cell`}>
              Equipamento
            </th>
            <th scope="col" className={HEAD}>
              Técnico
            </th>
            <th scope="col" className={HEAD}>
              Prioridade
            </th>
            <th scope="col" className={HEAD}>
              Estado
            </th>
            <th scope="col" className={`${HEAD} hidden xl:table-cell`}>
              Progresso
            </th>
            <th scope="col" className={HEAD}>
              Data prevista
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-neutral-50">
              <td className={CELL}>
                <div className="flex flex-col gap-1">
                  {isAwaitingReview(item) ? (
                    <Link href={reviewHref(item)} className="font-medium text-brand-700 hover:underline">
                      {item.code}
                    </Link>
                  ) : (
                    <span className="text-neutral-900">{item.code}</span>
                  )}
                  <span className="text-sm text-neutral-600">{item.title}</span>
                </div>
              </td>
              <td className={CELL}>
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-neutral-900">{item.clientName}</span>
                  <span className="flex items-center gap-1 text-sm text-neutral-600">
                    <IoLocationOutline aria-hidden className="size-3.5 shrink-0" />
                    {item.siteName}
                  </span>
                  {item.equipmentName && (
                    <span className="text-sm text-neutral-600 2xl:hidden">{item.equipmentName}</span>
                  )}
                </div>
              </td>
              <td className={`${CELL} hidden text-neutral-900 2xl:table-cell`}>{item.equipmentName ?? '—'}</td>
              <td className={CELL}>
                <Technician item={item} />
              </td>
              <td className={CELL}>
                <span
                  className={`inline-flex rounded px-2 py-1 text-xs font-bold tracking-wide uppercase ${PRIORITY_BADGE[item.priority]}`}
                >
                  {INSPECTION_PRIORITY_LABELS[item.priority]}
                </span>
              </td>
              <td className={CELL}>
                <div className="flex flex-col items-start gap-1">
                  <StatusBadge label={INSPECTION_STATUS_LABELS[item.status]} tone={INSPECTION_STATUS_TONES[item.status]} />
                  <span className="text-xs text-neutral-500">Atualizada {formatDateTime(item.updatedAt)}</span>
                  {isAwaitingReview(item) && (
                    <Link
                      href={reviewHref(item)}
                      className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
                    >
                      Revisar
                      <IoArrowForward aria-hidden className="size-3.5" />
                    </Link>
                  )}
                </div>
              </td>
              <td className={`${CELL} hidden xl:table-cell`}>
                <Progress item={item} />
              </td>
              <td className={CELL}>
                <PlannedDate item={item} today={today} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
