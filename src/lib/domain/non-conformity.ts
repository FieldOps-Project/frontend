import type { EvidencePhoto } from '@/lib/domain/evidence'
import { inspectionReference } from '@/lib/domain/inspection'
import type { Severity } from '@/lib/domain/inspection-review'
import type { UserRole } from '@/lib/domain/user'

export const FIELD_FINDINGS_ROLES: readonly UserRole[] = ['SUPERVISOR']

export type NonConformityStatus = 'OPEN'

export const NON_CONFORMITY_STATUS_LABELS: Record<NonConformityStatus, string> = {
  OPEN: 'Aberta',
}

export type NonConformityRecord = {
  readonly id: string
  readonly inspectionId: string
  readonly inspectionItemId: string | null
  readonly title: string
  readonly description: string
  readonly severity: Severity
  readonly status: NonConformityStatus
  readonly createdBy: string
  readonly createdAtDevice: string
  readonly serverReceivedAt: string
}

export type InspectionItemSnapshot = {
  readonly id: string
  readonly itemCode: string
  readonly itemTitle: string
  readonly itemDescription: string | null
}

export type NonConformityInspection = {
  readonly id: string
  readonly title: string
  readonly clientId: string
  readonly siteId: string
  readonly equipmentId: string | null
  readonly itemSnapshots: readonly InspectionItemSnapshot[]
}

export type NameIndex = ReadonlyMap<string, string>

export type NonConformityLookups = {
  readonly inspections: ReadonlyMap<string, NonConformityInspection>
  readonly clients: NameIndex
  readonly sites: NameIndex
  readonly equipment: NameIndex
  readonly users: NameIndex
}

export type NonConformityListItem = {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly severity: Severity
  readonly status: NonConformityStatus
  readonly inspectionId: string
  readonly inspectionCode: string
  readonly inspectionTitle: string | null
  readonly clientName: string | null
  readonly siteName: string | null
  readonly equipmentName: string | null
  readonly itemCode: string | null
  readonly itemTitle: string | null
  readonly itemQuestion: string | null
  readonly createdByName: string | null
  readonly createdAtDevice: string
  readonly serverReceivedAt: string
}

export type NonConformityDetail = NonConformityListItem & {
  readonly evidences: readonly EvidencePhoto[]
}

export type InspectionFinding = Pick<NonConformityListItem, 'id' | 'title' | 'description' | 'severity' | 'itemCode'>

export type NonConformityFilters = {
  readonly severity?: Severity
  readonly clientId?: string
}

const SEVERITY_RANK: Record<Severity, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

export function bySeverityDesc(
  a: Pick<NonConformityRecord, 'severity' | 'createdAtDevice'>,
  b: Pick<NonConformityRecord, 'severity' | 'createdAtDevice'>,
): number {
  return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || b.createdAtDevice.localeCompare(a.createdAtDevice)
}

function nameOf(index: NameIndex, id: string | null | undefined): string | null {
  return id ? (index.get(id) ?? null) : null
}

export function describeNonConformity(record: NonConformityRecord, lookups: NonConformityLookups): NonConformityListItem {
  const inspection = lookups.inspections.get(record.inspectionId)
  const item = inspection?.itemSnapshots.find((snapshot) => snapshot.id === record.inspectionItemId)

  return {
    id: record.id,
    title: record.title,
    description: record.description,
    severity: record.severity,
    status: record.status,
    inspectionId: record.inspectionId,
    inspectionCode: inspectionReference(record.inspectionId),
    inspectionTitle: inspection?.title ?? null,
    clientName: nameOf(lookups.clients, inspection?.clientId),
    siteName: nameOf(lookups.sites, inspection?.siteId),
    equipmentName: nameOf(lookups.equipment, inspection?.equipmentId),
    itemCode: item?.itemCode ?? null,
    itemTitle: item?.itemTitle ?? null,
    itemQuestion: item?.itemDescription ?? null,
    createdByName: nameOf(lookups.users, record.createdBy),
    createdAtDevice: record.createdAtDevice,
    serverReceivedAt: record.serverReceivedAt,
  }
}

export function toInspectionFinding(item: NonConformityListItem): InspectionFinding {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    severity: item.severity,
    itemCode: item.itemCode,
  }
}
