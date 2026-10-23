import { isInspectionPriority } from '@/lib/domain/inspection-scheduling'

/**
 * Validacao do agendamento, a mesma no navegador e na Server Action.
 *
 * Cliente, local, tecnico e data prevista sao obrigatorios (RN-025), o modelo
 * precisa ser uma versao publicada (RN-024) e o equipamento so pode faltar
 * quando o modelo inspeciona o local como um todo (RN-026).
 */
export type ScheduleField =
  | 'templateVersionId'
  | 'clientId'
  | 'siteId'
  | 'equipmentId'
  | 'technicianId'
  | 'supervisorId'
  | 'scheduledDate'
  | 'priority'
  | 'instructions'

export type ScheduleErrors = Partial<Record<ScheduleField, string>>

export type ScheduleValues = Partial<Record<ScheduleField, string>>

export const INSTRUCTIONS_MAX_LENGTH = 1000

/** Ordem dos campos na tela, para levar o foco ao primeiro invalido. */
export const SCHEDULE_FIELD_ORDER: readonly ScheduleField[] = [
  'templateVersionId',
  'clientId',
  'siteId',
  'equipmentId',
  'technicianId',
  'supervisorId',
  'scheduledDate',
  'priority',
  'instructions',
]

const DATE = /^\d{4}-\d{2}-\d{2}$/

function filled(value: string | undefined): boolean {
  return Boolean(value && value.trim() !== '')
}

export function validateSchedule(values: ScheduleValues, options: { requiresEquipment: boolean }): ScheduleErrors {
  const errors: ScheduleErrors = {}

  if (!filled(values.templateVersionId)) errors.templateVersionId = 'Selecione um modelo publicado.'
  if (!filled(values.clientId)) errors.clientId = 'A seleção do cliente é obrigatória.'
  if (!filled(values.siteId)) errors.siteId = 'A seleção do local é obrigatória.'
  if (options.requiresEquipment && !filled(values.equipmentId)) {
    errors.equipmentId = 'Este modelo inspeciona um equipamento: selecione qual.'
  }
  if (!filled(values.technicianId)) errors.technicianId = 'A atribuição do técnico é obrigatória.'

  if (!filled(values.scheduledDate)) {
    errors.scheduledDate = 'A data prevista é obrigatória.'
  } else if (!DATE.test(values.scheduledDate ?? '') || Number.isNaN(Date.parse(`${values.scheduledDate}T00:00:00Z`))) {
    errors.scheduledDate = 'Informe uma data válida.'
  }

  if (filled(values.priority) && !isInspectionPriority(values.priority)) {
    errors.priority = 'Prioridade inválida.'
  }
  if ((values.instructions ?? '').length > INSTRUCTIONS_MAX_LENGTH) {
    errors.instructions = `Use no máximo ${INSTRUCTIONS_MAX_LENGTH} caracteres.`
  }

  return errors
}

export function hasScheduleErrors(errors: ScheduleErrors): boolean {
  return Object.values(errors).some(Boolean)
}

export function firstInvalidField(errors: ScheduleErrors): ScheduleField | null {
  return SCHEDULE_FIELD_ORDER.find((field) => errors[field]) ?? null
}

/** Data prevista no passado gera aviso, sem bloquear (issue #16). */
export function isPastDate(date: string | undefined, today: string): boolean {
  return Boolean(date && DATE.test(date) && date < today)
}

/** Hoje (`AAAA-MM-DD`) no fuso da operacao. */
export function todayInSaoPaulo(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(now)
}
