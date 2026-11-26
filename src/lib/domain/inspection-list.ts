import type { InspectionStatus } from '@/lib/domain/inspection'
import type { InspectionPriority } from '@/lib/domain/inspection-scheduling'

export type InspectionListItem = {
  readonly id: string
  readonly title: string
  readonly clientId: string
  readonly clientName: string
  readonly siteId: string
  readonly siteName: string
  readonly equipmentId: string | null
  readonly equipmentName: string | null
  readonly technicianId: string | null
  readonly technicianName: string | null
  readonly priority: InspectionPriority
  readonly status: InspectionStatus
  readonly scheduledFor: string
  readonly answeredItems: number
  readonly applicableItems: number
  readonly updatedAt: string
  readonly overdue: boolean
}

export type InspectionFilters = {
  readonly search?: string
  readonly status?: InspectionStatus
  readonly technicianId?: string
  readonly clientId?: string
  readonly priority?: InspectionPriority
  readonly date?: string
  readonly overdue?: boolean
}

export const AWAITING_REVIEW: readonly InspectionStatus[] = ['SUBMITTED', 'UNDER_REVIEW']

const DAY_MS = 86_400_000
const TIME_ZONE = 'America/Sao_Paulo'
const SAO_PAULO_OFFSET = '-03:00'

const DAY = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE })

export function dayInSaoPaulo(value: string | Date): string {
  return DAY.format(new Date(value))
}

export function dayRangeInSaoPaulo(day: string): { readonly from: string; readonly to: string } {
  return { from: `${day}T00:00:00${SAO_PAULO_OFFSET}`, to: `${day}T23:59:59.999${SAO_PAULO_OFFSET}` }
}

function daysBetween(fromDay: string, toDay: string): number {
  return Math.round((Date.parse(`${toDay}T00:00:00Z`) - Date.parse(`${fromDay}T00:00:00Z`)) / DAY_MS)
}

export function isAwaitingReview(item: Pick<InspectionListItem, 'status'>): boolean {
  return AWAITING_REVIEW.includes(item.status)
}

export function progressPercent(item: Pick<InspectionListItem, 'answeredItems' | 'applicableItems'>): number {
  if (item.applicableItems <= 0) return 0
  return Math.min(100, Math.round((item.answeredItems / item.applicableItems) * 100))
}

const TIME = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TIME_ZONE })

export function dueLabel(
  item: Pick<InspectionListItem, 'scheduledFor'> & Partial<Pick<InspectionListItem, 'overdue'>>,
  today: string,
): string | null {
  if (item.overdue) return 'Atrasada'

  const ahead = daysBetween(today, dayInSaoPaulo(item.scheduledFor))
  if (ahead === 0) return `Hoje, ${TIME.format(new Date(item.scheduledFor))}`
  if (ahead === 1) return 'Amanhã'
  if (ahead > 1) return `Em ${ahead} dias`
  return null
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return `${first}${last}`.toUpperCase()
}
