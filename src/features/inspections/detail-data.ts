import 'server-only'

import { notFound } from 'next/navigation'

import { loadActiveUsers } from '@/features/catalog/lookups'
import {
  demoInspectionDetail,
  demoInspectionHistory,
  demoPlanningPeople,
  isDemoInspectionId,
} from '@/features/inspections/detail-fixture'
import { load, loadOptional } from '@/lib/dal'
import type { InspectionDetail, InspectionHistoryEvent } from '@/lib/domain/inspection-detail'

export type PlanningPerson = { readonly id: string; readonly name: string }

export type PlanningPeople = {
  readonly technicians: readonly PlanningPerson[]
  readonly supervisors: readonly PlanningPerson[]
}

/** Inspecao de demonstracao, servida so em desenvolvimento. */
export function isDemoInspection(id: string): boolean {
  return process.env.NEXT_PUBLIC_APP_ENV === 'development' && isDemoInspectionId(id)
}

/**
 * Detalhe da inspecao. Ponto unico de troca para a API: hoje ela nao publica
 * `GET /inspections/{id}`, entao em desenvolvimento as inspecoes de
 * demonstracao respondem daqui; qualquer outro identificador segue para a API,
 * e o 404 dela leva ao `not-found` da rota.
 */
export async function loadInspectionDetail(id: string): Promise<InspectionDetail> {
  if (isDemoInspection(id)) {
    return demoInspectionDetail(id) ?? notFound()
  }
  return load<InspectionDetail>(`/inspections/${id}`)
}

/**
 * Historico de estados a partir da auditoria (`GET /inspections/{id}/history`).
 * Enquanto a API nao publica o endpoint, devolve `null` e a tela mostra o bloco
 * como indisponivel, sem derrubar o restante do detalhe.
 */
export async function loadInspectionHistory(id: string): Promise<readonly InspectionHistoryEvent[] | null> {
  if (isDemoInspection(id)) {
    return demoInspectionHistory(id)
  }
  return loadOptional<readonly InspectionHistoryEvent[]>(`/inspections/${id}/history`)
}

/** Tecnicos e supervisores ativos que a edicao do planejamento oferece (RN-027). */
export async function loadPlanningPeople(id: string): Promise<PlanningPeople> {
  if (isDemoInspection(id)) {
    return demoPlanningPeople()
  }
  const [technicians, supervisors] = await Promise.all([loadActiveUsers('TECHNICIAN'), loadActiveUsers('SUPERVISOR')])
  return {
    technicians: technicians.map(({ id: userId, name }) => ({ id: userId, name })),
    supervisors: supervisors.map(({ id: userId, name }) => ({ id: userId, name })),
  }
}
