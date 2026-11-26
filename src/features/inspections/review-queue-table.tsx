import Link from 'next/link'
import { MdArrowForward, MdOutlineLocationOn, MdOutlinePerson, MdOutlinePersonSearch, MdOutlineSchedule } from 'react-icons/md'

import { StatusBadge } from '@/components/ui/status-badge'
import { INSPECTION_STATUS_LABELS, INSPECTION_STATUS_TONES, inspectionReference } from '@/lib/domain/inspection'
import { INSPECTION_PRIORITY_LABELS } from '@/lib/domain/inspection-scheduling'
import { isWaitingLong, waitingLabel, type ReviewQueueItem } from '@/lib/domain/review-queue'
import { formatDateTime } from '@/lib/format'

const HEAD = 'px-4 py-4 text-left text-[13px] font-medium tracking-wider whitespace-nowrap text-neutral-700 uppercase'
const CELL = 'px-4 py-4 align-top'

const ACTION_BUTTON =
  'inline-flex h-10 items-center gap-1.5 rounded-field bg-brand-700 px-4 text-sm font-semibold whitespace-nowrap text-neutral-0 transition-colors hover:bg-brand-800'

export function reviewHref(item: Pick<ReviewQueueItem, 'id'>): string {
  return `/inspections/${item.id}/review?from=queue`
}

function actionHref(item: ReviewQueueItem, canReview: boolean): string {
  return canReview ? reviewHref(item) : `/inspections/${item.id}`
}

function ActionLink({ item, canReview }: { item: ReviewQueueItem; canReview: boolean }) {
  const verb = canReview ? 'Revisar' : 'Abrir'
  return (
    <Link
      href={actionHref(item, canReview)}
      className={ACTION_BUTTON}
      aria-label={`${verb} ${inspectionReference(item.id)}`}
    >
      {verb}
      <MdArrowForward aria-hidden className="size-4" />
    </Link>
  )
}

function Waiting({ item, now }: { item: ReviewQueueItem; now: Date }) {
  const long = isWaitingLong(item.updatedAt, now)
  return (
    <span className={`flex items-center gap-1.5 whitespace-nowrap ${long ? 'font-medium text-danger' : 'text-neutral-900'}`}>
      <MdOutlineSchedule aria-hidden className="size-4 shrink-0" />
      <time dateTime={item.updatedAt} title={`Atualizada em ${formatDateTime(item.updatedAt)}`}>
        Atualizada {waitingLabel(item.updatedAt, now)}
      </time>
    </span>
  )
}

function ReviewState({ item }: { item: ReviewQueueItem }) {
  return (
    <div className="flex flex-col items-start gap-1.5 [&>span:first-child]:whitespace-nowrap">
      <StatusBadge label={INSPECTION_STATUS_LABELS[item.status]} tone={INSPECTION_STATUS_TONES[item.status]} />
      {item.status === 'UNDER_REVIEW' ? (
        <span className="flex items-center gap-1 text-sm text-neutral-700">
          <MdOutlinePersonSearch aria-hidden className="size-4 shrink-0" />
          Revisão em andamento
        </span>
      ) : (
        <span className="text-sm text-neutral-600">Aguardando revisor</span>
      )}
    </div>
  )
}

export function ReviewQueueTable({
  items,
  now,
  canReview,
}: {
  items: readonly ReviewQueueItem[]
  now: Date
  canReview: boolean
}) {
  return (
    <>
      <ul className="divide-y divide-neutral-200 xl:hidden">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-3 px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <Link href={`/inspections/${item.id}`} className="font-medium text-brand-700 hover:underline">
                  {inspectionReference(item.id)}
                </Link>
                <span className="text-sm text-neutral-600">{item.title}</span>
              </div>
              <Waiting item={item} now={now} />
            </div>
            <span className="text-sm text-neutral-700">
              {item.clientName} · {item.siteName}
            </span>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <ReviewState item={item} />
              <ActionLink item={item} canReview={canReview} />
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden xl:block">
        <table className="w-full">
          <thead className="border-b border-neutral-200 bg-neutral-100">
            <tr>
              <th scope="col" className={HEAD}>
                Inspeção
              </th>
              <th scope="col" className={HEAD}>
                Cliente e local
              </th>
              <th scope="col" className={HEAD}>
                Última atualização
              </th>
              <th scope="col" className={HEAD}>
                Revisão
              </th>
              <th scope="col" className={HEAD}>
                <span className="sr-only">Ação</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-surface-hover">
                <td className={CELL}>
                  <div className="flex flex-col gap-1">
                    <Link href={`/inspections/${item.id}`} className="font-medium whitespace-nowrap text-brand-700 hover:underline">
                      {inspectionReference(item.id)}
                    </Link>
                    <span className="text-sm text-neutral-600">{item.title}</span>
                    <span className="text-xs text-neutral-600">
                      Prioridade <span className="font-semibold text-neutral-800">{INSPECTION_PRIORITY_LABELS[item.priority]}</span>
                    </span>
                  </div>
                </td>
                <td className={CELL}>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-neutral-900">{item.clientName}</span>
                    <span className="flex items-center gap-1 text-sm text-neutral-600">
                      <MdOutlineLocationOn aria-hidden className="size-3.5 shrink-0" />
                      {item.siteName}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-neutral-600">
                      <MdOutlinePerson aria-hidden className="size-3.5 shrink-0" />
                      {item.technicianName ?? 'Sem técnico'}
                    </span>
                  </div>
                </td>
                <td className={CELL}>
                  <Waiting item={item} now={now} />
                </td>
                <td className={CELL}>
                  <ReviewState item={item} />
                </td>
                <td className={`${CELL} text-right`}>
                  <ActionLink item={item} canReview={canReview} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
