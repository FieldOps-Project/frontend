import { INSTRUCTIONS_MAX_LENGTH } from '@/features/inspections/schedule-validation'
import { isInspectionPriority } from '@/lib/domain/inspection-scheduling'

/**
 * Validacao da edicao do planejamento, a mesma no navegador e na Server Action.
 *
 * So mudam tecnico, supervisor, data prevista, prioridade e instrucoes. Modelo,
 * cliente, local e equipamento definem o snapshot e o lugar da inspecao: para
 * troca-los, cancela-se e agenda-se outra. Tecnico e data continuam
 * obrigatorios (RN-025).
 */
export type PlanningField = 'technicianId' | 'supervisorId' | 'scheduledDate' | 'priority' | 'instructions'

export type PlanningValues = Partial<Record<PlanningField, string>>

export type PlanningErrors = Partial<Record<PlanningField, string>>

export const PLANNING_FIELD_ORDER: readonly PlanningField[] = [
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

export function validatePlanning(values: PlanningValues): PlanningErrors {
  const errors: PlanningErrors = {}

  if (!filled(values.technicianId)) errors.technicianId = 'A atribuição do técnico é obrigatória.'

  if (!filled(values.scheduledDate)) {
    errors.scheduledDate = 'A data prevista é obrigatória.'
  } else if (!DATE.test(values.scheduledDate ?? '') || Number.isNaN(Date.parse(`${values.scheduledDate}T00:00:00Z`))) {
    errors.scheduledDate = 'Informe uma data válida.'
  }

  if (!filled(values.priority) || !isInspectionPriority(values.priority)) {
    errors.priority = 'Selecione a prioridade.'
  }
  if ((values.instructions ?? '').length > INSTRUCTIONS_MAX_LENGTH) {
    errors.instructions = `Use no máximo ${INSTRUCTIONS_MAX_LENGTH} caracteres.`
  }

  return errors
}

export function hasPlanningErrors(errors: PlanningErrors): boolean {
  return Object.values(errors).some(Boolean)
}

export function firstInvalidPlanningField(errors: PlanningErrors): PlanningField | null {
  return PLANNING_FIELD_ORDER.find((field) => errors[field]) ?? null
}
