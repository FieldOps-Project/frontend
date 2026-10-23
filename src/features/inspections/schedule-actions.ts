'use server'

import { redirect } from 'next/navigation'

import { loadActiveUsers, loadClients, loadEquipment, loadSites } from '@/features/catalog/lookups'
import {
  hasScheduleErrors,
  validateSchedule,
  type ScheduleErrors,
  type ScheduleValues,
} from '@/features/inspections/schedule-validation'
import { isDemoTemplateVersion, loadPublishedTemplateVersions } from '@/features/inspections/scheduling-data'
import { formError, requireRole, send } from '@/lib/dal'
import {
  DEFAULT_INSPECTION_PRIORITY,
  isInspectionPriority,
  scheduledForFromDate,
  type ScheduleInspectionRequest,
} from '@/lib/domain/inspection-scheduling'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { text, submittedValues } from '@/lib/form-data'
import type { FormState } from '@/lib/form-state'

const FIELDS = [
  'templateVersionId',
  'clientId',
  'siteId',
  'equipmentId',
  'technicianId',
  'supervisorId',
  'scheduledDate',
  'priority',
  'instructions',
] as const

function readValues(formData: FormData): ScheduleValues {
  return Object.fromEntries(FIELDS.map((field) => [field, text(formData, field) ?? undefined]))
}

function invalid(fieldErrors: ScheduleErrors, formData: FormData): FormState {
  return {
    status: 'error',
    message: 'Revise os campos destacados.',
    fieldErrors: fieldErrors as Record<string, string>,
    values: submittedValues(formData),
  }
}

/**
 * Agenda a inspecao com o tecnico ja atribuido (issue #16).
 *
 * Revalida tudo no servidor -- a Server Action e ponto de entrada publico -- e
 * confere o encadeamento contra o catalogo ativo: o local precisa ser do
 * cliente, o equipamento precisa ser do local (RN-014), registros inativos nao
 * entram (RN-012) e so tecnico ativo recebe atribuicao (RN-027). A API decide
 * por ultimo; o erro dela volta para o campo correspondente.
 */
export async function createInspection(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireRole(MANAGER_ROLES)
  const values = readValues(formData)

  const versions = await loadPublishedTemplateVersions()
  const version = versions.find((candidate) => candidate.versionId === values.templateVersionId)

  const errors: ScheduleErrors = validateSchedule(values, { requiresEquipment: version?.requiresEquipment ?? false })
  if (values.templateVersionId && !version) {
    errors.templateVersionId = 'Este modelo não está disponível para novas inspeções.'
  }
  if (hasScheduleErrors(errors)) {
    return invalid(errors, formData)
  }

  const [clients, sites, equipment, technicians, supervisors] = await Promise.all([
    loadClients('ACTIVE'),
    loadSites('ACTIVE'),
    loadEquipment('ACTIVE'),
    loadActiveUsers('TECHNICIAN'),
    loadActiveUsers('SUPERVISOR'),
  ])

  const site = sites.find((candidate) => candidate.id === values.siteId)
  const chosenEquipment = values.equipmentId
    ? equipment.find((candidate) => candidate.id === values.equipmentId)
    : undefined

  if (!clients.some((client) => client.id === values.clientId)) {
    errors.clientId = 'Cliente inativo ou inexistente.'
  }
  if (!site || site.clientId !== values.clientId) {
    errors.siteId = 'O local não pertence ao cliente selecionado ou está inativo.'
  }
  if (values.equipmentId && (!chosenEquipment || chosenEquipment.siteId !== values.siteId)) {
    errors.equipmentId = 'O equipamento não pertence ao local selecionado ou está inativo.'
  }
  if (!technicians.some((technician) => technician.id === values.technicianId)) {
    errors.technicianId = 'Somente técnico ativo pode receber a inspeção.'
  }
  if (values.supervisorId && !supervisors.some((supervisor) => supervisor.id === values.supervisorId)) {
    errors.supervisorId = 'Supervisor inativo ou inexistente.'
  }
  if (hasScheduleErrors(errors)) {
    return invalid(errors, formData)
  }

  const body: ScheduleInspectionRequest = {
    templateVersionId: values.templateVersionId as string,
    clientId: values.clientId as string,
    siteId: values.siteId as string,
    equipmentId: values.equipmentId ?? null,
    technicianId: values.technicianId as string,
    supervisorId: values.supervisorId ?? null,
    scheduledFor: scheduledForFromDate(values.scheduledDate as string),
    priority: isInspectionPriority(values.priority) ? values.priority : DEFAULT_INSPECTION_PRIORITY,
    instructions: values.instructions ?? null,
  }

  if (isDemoTemplateVersion(body.templateVersionId)) {
    return {
      status: 'success',
      message: 'Demonstração: o agendamento é válido, mas não foi enviado. A API ainda não tem POST /inspections.',
    }
  }

  try {
    await send('/inspections', { method: 'POST', body })
  } catch (error) {
    return formError(error, submittedValues(formData))
  }

  redirect('/inspections?notice=scheduled')
}
