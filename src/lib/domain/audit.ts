import { INSPECTION_STATUS_LABELS } from '@/lib/domain/inspection'
import { historyActionLabel } from '@/lib/domain/inspection-detail'
import type { InspectionHistoryEvent } from '@/lib/domain/inspection-history'
import { dayInSaoPaulo } from '@/lib/domain/inspection-list'
import type { Page, StatusTone } from '@/lib/domain/page'

export const AUDIT_ENTITY_TYPES = [
  'INSPECTION',
  'INSPECTION_RESPONSE',
  'INSPECTION_EVIDENCE',
  'NON_CONFORMITY',
  'INSPECTION_REPORT',
] as const

export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number]

export const AUDIT_ENTITY_LABELS: Record<AuditEntityType, string> = {
  INSPECTION: 'Inspeção',
  INSPECTION_RESPONSE: 'Resposta',
  INSPECTION_EVIDENCE: 'Evidência',
  NON_CONFORMITY: 'Não conformidade',
  INSPECTION_REPORT: 'Relatório',
}

export function auditEntityLabel(entityType: string): string {
  return AUDIT_ENTITY_LABELS[entityType as AuditEntityType] ?? entityType
}

export function auditActionTone(action: string): StatusTone {
  if (/CANCELED|REJECTED|REMOVED/.test(action)) return 'danger'
  if (/APPROVED/.test(action)) return 'info'
  if (/NON_CONFORMITY/.test(action)) return 'warning'
  if (/SUBMITTED|COMPLETED/.test(action)) return 'success'
  return 'neutral'
}

export type AuditEvent = InspectionHistoryEvent & {
  readonly inspectionId: string
  readonly inspectionTitle: string
}

export type AuditOption = { readonly value: string; readonly label: string }

export const AUDIT_PERIODS = ['today', '7d', '30d', '90d', 'all'] as const
export type AuditPeriod = (typeof AUDIT_PERIODS)[number]

export const AUDIT_PERIOD_LABELS: Record<AuditPeriod, string> = {
  today: 'Hoje',
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  '90d': 'Últimos 90 dias',
  all: 'Todo o período',
}

export const DEFAULT_AUDIT_PERIOD: AuditPeriod = 'all'

export type AuditFilters = {
  readonly period: AuditPeriod
  readonly actorId?: string
  readonly entityType?: AuditEntityType
  readonly action?: string
}

const DAY_MS = 86_400_000

export function periodStart(period: AuditPeriod, today: string): string | null {
  const days = { today: 0, '7d': 6, '30d': 29, '90d': 89, all: null }[period]
  if (days === null) return null
  return new Date(Date.parse(`${today}T00:00:00Z`) - days * DAY_MS).toISOString().slice(0, 10)
}

function newestFirst(events: readonly AuditEvent[]): readonly AuditEvent[] {
  return events.toSorted((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
}

export function toAuditEvents(
  inspection: { readonly id: string; readonly title: string },
  history: readonly InspectionHistoryEvent[],
): readonly AuditEvent[] {
  return newestFirst(history.map((event) => ({ ...event, inspectionId: inspection.id, inspectionTitle: inspection.title })))
}

export function mergeAuditEvents(groups: readonly (readonly AuditEvent[])[]): readonly AuditEvent[] {
  return newestFirst(groups.flat())
}

export function auditEventDetail(event: AuditEvent): string | null {
  const transition =
    event.previousStatus && event.newStatus
      ? `${INSPECTION_STATUS_LABELS[event.previousStatus]} → ${INSPECTION_STATUS_LABELS[event.newStatus]}`
      : null
  const detail = [transition, event.note].filter((part): part is string => part !== null).join(' · ')
  return detail === '' ? null : detail
}

export function filterAuditEvents(events: readonly AuditEvent[], filters: AuditFilters, today: string): readonly AuditEvent[] {
  const from = periodStart(filters.period, today)

  return events.filter(
    (event) =>
      (from === null || dayInSaoPaulo(event.occurredAt) >= from) &&
      (!filters.actorId || event.actorId === filters.actorId) &&
      (!filters.entityType || event.entityType === filters.entityType) &&
      (!filters.action || event.action === filters.action),
  )
}

function sortedOptions(entries: Iterable<readonly [string, string]>): readonly AuditOption[] {
  return [...new Map(entries)]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
}

export function auditActorOptions(events: readonly AuditEvent[]): readonly AuditOption[] {
  return sortedOptions(events.flatMap((event) => (event.actorId && event.actorName ? [[event.actorId, event.actorName] as const] : [])))
}

export function auditEntityOptions(events: readonly AuditEvent[]): readonly AuditOption[] {
  return sortedOptions(events.map((event) => [event.entityType, auditEntityLabel(event.entityType)] as const))
}

export function auditActionOptions(events: readonly AuditEvent[]): readonly AuditOption[] {
  return sortedOptions(events.map((event) => [event.action, historyActionLabel(event.action)] as const))
}

export function paginateEvents(events: readonly AuditEvent[], page: number, size: number): Page<AuditEvent> {
  const totalPages = Math.max(Math.ceil(events.length / size), 1)
  const current = Math.min(Math.max(page, 0), totalPages - 1)

  return {
    content: events.slice(current * size, (current + 1) * size),
    page: current,
    size,
    totalElements: events.length,
    totalPages,
    first: current === 0,
    last: current >= totalPages - 1,
  }
}
