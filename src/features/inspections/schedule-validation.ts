import { isInspectionPriority } from '@/lib/domain/inspection-scheduling'

export type ScheduleField =
  | 'templateVersionId'
  | 'clientId'
  | 'siteId'
  | 'equipmentId'
  | 'technicianId'
  | 'supervisorId'
  | 'title'
  | 'scheduledDate'
  | 'priority'
  | 'instructions'

export type ScheduleErrors = Partial<Record<ScheduleField, string>>

export type ScheduleValues = Partial<Record<ScheduleField, string>>

export const TITLE_MAX_LENGTH = 255

export const INSTRUCTIONS_MAX_LENGTH = 2000

export const SCHEDULE_FIELD_ORDER: readonly ScheduleField[] = [
  'templateVersionId',
  'clientId',
  'siteId',
  'equipmentId',
  'technicianId',
  'supervisorId',
  'title',
  'scheduledDate',
  'priority',
  'instructions',
]

const DATE = /^\d{4}-\d{2}-\d{2}$/

export function filled(value: string | undefined): boolean {
  return Boolean(value && value.trim() !== '')
}

export function validateTitle(value: string | undefined): string | undefined {
  if (!filled(value)) return 'O título é obrigatório.'
  if ((value ?? '').trim().length > TITLE_MAX_LENGTH) return `Use no máximo ${TITLE_MAX_LENGTH} caracteres.`
  return undefined
}

export function validateScheduledDate(value: string | undefined): string | undefined {
  if (!filled(value)) return 'A data prevista é obrigatória.'
  if (!DATE.test(value ?? '') || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) return 'Informe uma data válida.'
  return undefined
}

export function validateInstructions(value: string | undefined): string | undefined {
  return (value ?? '').length > INSTRUCTIONS_MAX_LENGTH ? `Use no máximo ${INSTRUCTIONS_MAX_LENGTH} caracteres.` : undefined
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

  const title = validateTitle(values.title)
  if (title) errors.title = title

  const scheduledDate = validateScheduledDate(values.scheduledDate)
  if (scheduledDate) errors.scheduledDate = scheduledDate

  if (filled(values.priority) && !isInspectionPriority(values.priority)) {
    errors.priority = 'Prioridade inválida.'
  }

  const instructions = validateInstructions(values.instructions)
  if (instructions) errors.instructions = instructions

  return errors
}

export function hasScheduleErrors(errors: ScheduleErrors): boolean {
  return Object.values(errors).some(Boolean)
}

export function firstInvalidField(errors: ScheduleErrors): ScheduleField | null {
  return SCHEDULE_FIELD_ORDER.find((field) => errors[field]) ?? null
}

export function isPastDate(date: string | undefined, today: string): boolean {
  return Boolean(date && DATE.test(date) && date < today)
}

export function todayInSaoPaulo(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(now)
}
