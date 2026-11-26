import { INSPECTION_STATUSES, type InspectionStatus } from '@/lib/domain/inspection'
import { SEVERITIES, type Severity } from '@/lib/domain/inspection-review'
import type { UserRole } from '@/lib/domain/user'

export const REVIEW_SHORTCUT_ROLES: readonly UserRole[] = ['SUPERVISOR']

export type DashboardSummaryRecord = {
  readonly totalInspections: number
  readonly overdueInspections: number
  readonly inspectionsAwaitingReview: number
  readonly inspectionsByStatus: readonly { readonly status: InspectionStatus; readonly count: number }[]
  readonly nonConformitiesBySeverity: readonly { readonly severity: Severity; readonly count: number }[]
}

export type DashboardSummary = {
  readonly inspectionsByStatus: Readonly<Record<InspectionStatus, number>>
  readonly awaitingReview: number
  readonly overdue: number
  readonly nonConformitiesBySeverity: Readonly<Record<Severity, number>>
}

export const CLOSED_STATUSES: readonly InspectionStatus[] = ['APPROVED', 'CANCELED']

function zeroed<K extends string>(keys: readonly K[]): Record<K, number> {
  return Object.fromEntries(keys.map((key) => [key, 0])) as Record<K, number>
}

export function emptyStatusCounts(): Record<InspectionStatus, number> {
  return zeroed(INSPECTION_STATUSES)
}

export function toDashboardSummary(record: DashboardSummaryRecord): DashboardSummary {
  const inspectionsByStatus = emptyStatusCounts()
  for (const { status, count } of record.inspectionsByStatus) {
    inspectionsByStatus[status] = count
  }

  const nonConformitiesBySeverity = zeroed(SEVERITIES)
  for (const { severity, count } of record.nonConformitiesBySeverity) {
    nonConformitiesBySeverity[severity] = count
  }

  return {
    inspectionsByStatus,
    awaitingReview: inspectionsByStatus.SUBMITTED + inspectionsByStatus.UNDER_REVIEW,
    overdue: record.overdueInspections,
    nonConformitiesBySeverity,
  }
}

export function activeTotal(counts: Readonly<Record<InspectionStatus, number>>): number {
  return INSPECTION_STATUSES.filter((status) => !CLOSED_STATUSES.includes(status)).reduce(
    (total, status) => total + (counts[status] ?? 0),
    0,
  )
}

export function hasNoInspections(counts: Readonly<Record<InspectionStatus, number>>): boolean {
  return INSPECTION_STATUSES.every((status) => (counts[status] ?? 0) === 0)
}

export function nonConformityTotal(counts: Readonly<Record<Severity, number>>): number {
  return SEVERITIES.reduce((total, severity) => total + counts[severity], 0)
}
