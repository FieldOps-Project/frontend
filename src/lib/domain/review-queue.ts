import type { InspectionStatus } from '@/lib/domain/inspection'
import type { InspectionListItem } from '@/lib/domain/inspection-list'

export const REVIEW_QUEUE_STATUSES = ['SUBMITTED', 'UNDER_REVIEW'] as const satisfies readonly InspectionStatus[]

export type ReviewQueueStatus = (typeof REVIEW_QUEUE_STATUSES)[number]

export type ReviewQueueItem = InspectionListItem & { readonly status: ReviewQueueStatus }

export function byLongestWait(a: ReviewQueueItem, b: ReviewQueueItem): number {
  return a.updatedAt.localeCompare(b.updatedAt)
}

const RELATIVE = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'always' })

export function waitingLabel(since: string, now: Date = new Date()): string {
  const sent = new Date(since).getTime()
  if (Number.isNaN(sent)) return 'sem data de atualização'
  const minutes = Math.max(Math.floor((now.getTime() - sent) / 60_000), 0)
  if (minutes < 1) return 'agora mesmo'
  if (minutes < 60) return RELATIVE.format(-minutes, 'minute')
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return RELATIVE.format(-hours, 'hour')
  return RELATIVE.format(-Math.floor(hours / 24), 'day')
}

export function isWaitingLong(since: string, now: Date = new Date()): boolean {
  const sent = new Date(since).getTime()
  return !Number.isNaN(sent) && now.getTime() - sent > 24 * 60 * 60_000
}
