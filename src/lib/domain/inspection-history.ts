import { parseAuditValues } from '@/lib/domain/audit-values'
import { isInspectionStatus, type InspectionStatus } from '@/lib/domain/inspection'

export type InspectionHistoryEntry = {
  readonly id: string
  readonly action: string
  readonly entityType: string
  readonly entityId: string
  readonly actorId: string | null
  readonly actorName: string | null
  readonly occurredAt: string
  readonly deviceOccurredAt: string | null
  readonly requestId: string | null
  readonly deviceId: string | null
  readonly previousValue: string | null
  readonly newValue: string | null
}

export type InspectionHistoryEvent = {
  readonly id: string
  readonly action: string
  readonly entityType: string
  readonly actorId: string | null
  readonly actorName: string | null
  readonly occurredAt: string
  readonly deviceOccurredAt: string | null
  readonly previousStatus: InspectionStatus | null
  readonly newStatus: InspectionStatus | null
  readonly note: string | null
}

export type ExecutionTimes = {
  readonly startedAtDevice: string | null
  readonly startedAtServer: string | null
  readonly completedAtDevice: string | null
  readonly submittedAtServer: string | null
}

export type Cancellation = {
  readonly canceledByName: string | null
  readonly canceledAt: string | null
  readonly canceledReason: string | null
}

const INSPECTION_ENTITY = 'INSPECTION'
const CANCELED_ACTION = 'INSPECTION_CANCELED'
const EXECUTION_ACTIONS: readonly string[] = [
  'INSPECTION_STARTED',
  'INSPECTION_COMPLETED',
  'INSPECTION_SUBMITTED',
  'INSPECTION_REOPENED',
]

function statusIn(entry: InspectionHistoryEntry, raw: string | null): InspectionStatus | null {
  if (entry.entityType !== INSPECTION_ENTITY) return null
  const status = parseAuditValues(raw).status
  return status !== undefined && isInspectionStatus(status) ? status : null
}

function noteOf(entry: InspectionHistoryEntry): string | null {
  const values = parseAuditValues(entry.newValue)
  if (values.format) return `Formato ${values.format}`
  return values.canceledReason ?? values.reason ?? values.comments ?? null
}

function lastOf(entries: readonly InspectionHistoryEntry[], actions: readonly string[]): InspectionHistoryEntry | undefined {
  return entries.findLast((entry) => entry.entityType === INSPECTION_ENTITY && actions.includes(entry.action))
}

export function toHistoryEvent(entry: InspectionHistoryEntry): InspectionHistoryEvent {
  return {
    id: entry.id,
    action: entry.action,
    entityType: entry.entityType,
    actorId: entry.actorId,
    actorName: entry.actorName,
    occurredAt: entry.occurredAt,
    deviceOccurredAt: entry.deviceOccurredAt,
    previousStatus: statusIn(entry, entry.previousValue),
    newStatus: statusIn(entry, entry.newValue),
    note: noteOf(entry),
  }
}

export function executionTimesOf(entries: readonly InspectionHistoryEntry[]): ExecutionTimes {
  const values = parseAuditValues(lastOf(entries, EXECUTION_ACTIONS)?.newValue)

  return {
    startedAtDevice: values.startedAtDevice ?? null,
    startedAtServer: values.startedAtServer ?? null,
    completedAtDevice: values.completedAtDevice ?? null,
    submittedAtServer: values.submittedAtServer ?? null,
  }
}

export function cancellationOf(entries: readonly InspectionHistoryEntry[]): Cancellation {
  const entry = lastOf(entries, [CANCELED_ACTION])
  const values = parseAuditValues(entry?.newValue)

  return {
    canceledByName: entry?.actorName ?? null,
    canceledAt: values.canceledAt ?? entry?.occurredAt ?? null,
    canceledReason: values.canceledReason ?? null,
  }
}
