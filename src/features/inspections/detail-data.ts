import 'server-only'

import { cache } from 'react'

import { loadActiveUsers } from '@/features/catalog/lookups'
import { load, loadIfPermitted } from '@/lib/dal'
import {
  composeInspectionDetail,
  type InspectionDetail,
  type InspectionRecord,
  type TemplateVersionRecord,
} from '@/lib/domain/inspection-detail'
import { toHistoryEvent, type InspectionHistoryEntry, type InspectionHistoryEvent } from '@/lib/domain/inspection-history'

export type PlanningPerson = { readonly id: string; readonly name: string }

export type PlanningPeople = {
  readonly technicians: readonly PlanningPerson[]
  readonly supervisors: readonly PlanningPerson[]
}

type Named = { readonly name: string }

const loadHistoryEntries = cache((id: string) => load<readonly InspectionHistoryEntry[]>(`/inspections/${id}/history`))

export function loadInspectionRecord(id: string): Promise<InspectionRecord> {
  return load<InspectionRecord>(`/inspections/${id}`)
}

async function nameOf(collection: string, id: string | null): Promise<string | null> {
  if (id === null) return null
  const record = await loadIfPermitted<Named>(`/${collection}/${id}`)
  return record?.name ?? null
}

export async function loadInspectionDetail(id: string): Promise<InspectionDetail> {
  const inspection = await loadInspectionRecord(id)

  const [template, client, site, equipmentName, technicianName, supervisorName, history] = await Promise.all([
    load<TemplateVersionRecord>(`/inspection-template-versions/${inspection.templateVersionId}`),
    load<Named>(`/clients/${inspection.clientId}`),
    load<Named>(`/sites/${inspection.siteId}`),
    nameOf('equipment', inspection.equipmentId),
    nameOf('users', inspection.technicianId),
    nameOf('users', inspection.supervisorId),
    loadHistoryEntries(id),
  ])

  return composeInspectionDetail({
    inspection,
    template,
    clientName: client.name,
    siteName: site.name,
    equipmentName,
    technicianName,
    supervisorName,
    history,
  })
}

export async function loadInspectionHistory(id: string): Promise<readonly InspectionHistoryEvent[]> {
  return (await loadHistoryEntries(id)).map(toHistoryEvent)
}

export async function loadPlanningPeople(): Promise<PlanningPeople> {
  const [technicians, supervisors] = await Promise.all([loadActiveUsers('TECHNICIAN'), loadActiveUsers('SUPERVISOR')])
  return {
    technicians: technicians.map(({ id, name }) => ({ id, name })),
    supervisors: supervisors.map(({ id, name }) => ({ id, name })),
  }
}
