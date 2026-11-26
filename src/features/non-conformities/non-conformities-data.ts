import 'server-only'

import { loadClients, loadEquipment, loadSites } from '@/features/catalog/lookups'
import { loadEvidenceRecords } from '@/features/evidence/evidence-data'
import { loadInspectionNonConformityRecords } from '@/features/non-conformities/non-conformity-records'
import { load, loadOptional, verifySession } from '@/lib/dal'
import {
  bySeverityDesc,
  describeNonConformity,
  FIELD_FINDINGS_ROLES,
  toInspectionFinding,
  type InspectionFinding,
  type NameIndex,
  type NonConformityDetail,
  type NonConformityFilters,
  type NonConformityInspection,
  type NonConformityListItem,
  type NonConformityLookups,
  type NonConformityRecord,
} from '@/lib/domain/non-conformity'
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, type Page } from '@/lib/domain/page'
import type { User } from '@/lib/domain/user'

export type FilterOption = { readonly value: string; readonly label: string }

export type NonConformityListing = {
  readonly page: Page<NonConformityListItem>
  readonly clients: readonly FilterOption[]
}

const NO_NAMES: NameIndex = new Map()

type Named = { readonly id: string; readonly name: string }

function nameIndex(items: readonly Named[]): NameIndex {
  return new Map(items.map((item) => [item.id, item.name]))
}

async function loadInspections(ids: readonly string[]): Promise<ReadonlyMap<string, NonConformityInspection>> {
  const unique = [...new Set(ids)]
  const inspections = await Promise.all(
    unique.map((id) => loadOptional<NonConformityInspection>(`/inspections/${id}`)),
  )
  return new Map(inspections.flatMap((inspection) => (inspection ? [[inspection.id, inspection] as const] : [])))
}

async function loadUserNames(): Promise<NameIndex> {
  const page = await loadOptional<Page<User>>('/users', { size: MAX_PAGE_SIZE })
  return nameIndex(page?.content ?? [])
}

async function loadLookups(inspectionIds: readonly string[]) {
  const [inspections, clients, sites, equipment, users] = await Promise.all([
    loadInspections(inspectionIds),
    loadClients(),
    loadSites(),
    loadEquipment(),
    loadUserNames(),
  ])
  const lookups: NonConformityLookups = {
    inspections,
    clients: nameIndex(clients),
    sites: nameIndex(sites),
    equipment: nameIndex(equipment),
    users,
  }

  return { lookups, clients }
}

export async function loadNonConformityListing(
  filters: NonConformityFilters,
  pageNumber: number,
  size: number = DEFAULT_PAGE_SIZE,
): Promise<NonConformityListing> {
  const records = await load<Page<NonConformityRecord>>('/non-conformities', {
    severity: filters.severity,
    clientId: filters.clientId,
    page: pageNumber,
    size,
  })
  const { lookups, clients } = await loadLookups(records.content.map((record) => record.inspectionId))

  return {
    page: { ...records, content: records.content.map((record) => describeNonConformity(record, lookups)) },
    clients: clients.map((client) => ({ value: client.id, label: client.name })),
  }
}

export async function loadNonConformity(id: string): Promise<NonConformityDetail> {
  const record = await load<NonConformityRecord>(`/non-conformities/${id}`)
  const [{ lookups }, evidences] = await Promise.all([
    loadLookups([record.inspectionId]),
    loadEvidenceRecords(record.inspectionId),
  ])

  return {
    ...describeNonConformity(record, lookups),
    evidences: evidences
      .filter((evidence) => evidence.nonConformityId === id)
      .toSorted((a, b) => a.capturedAtDevice.localeCompare(b.capturedAtDevice)),
  }
}

export async function loadInspectionNonConformities(inspectionId: string): Promise<readonly InspectionFinding[] | null> {
  const user = await verifySession()
  if (!FIELD_FINDINGS_ROLES.includes(user.role)) return null

  const [records, inspection] = await Promise.all([
    loadInspectionNonConformityRecords(inspectionId),
    loadOptional<NonConformityInspection>(`/inspections/${inspectionId}`),
  ])
  const lookups: NonConformityLookups = {
    inspections: new Map(inspection ? [[inspection.id, inspection]] : []),
    clients: NO_NAMES,
    sites: NO_NAMES,
    equipment: NO_NAMES,
    users: NO_NAMES,
  }

  return records
    .toSorted(bySeverityDesc)
    .map((record) => toInspectionFinding(describeNonConformity(record, lookups)))
}
