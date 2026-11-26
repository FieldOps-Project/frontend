import {
  filled,
  validateInstructions,
  validateScheduledDate,
  validateTitle,
} from '@/features/inspections/schedule-validation'
import { isInspectionPriority } from '@/lib/domain/inspection-scheduling'

export type PlanningField = 'title' | 'technicianId' | 'supervisorId' | 'scheduledDate' | 'priority' | 'instructions'

export type PlanningValues = Partial<Record<PlanningField, string>>

export type PlanningErrors = Partial<Record<PlanningField, string>>

export const PLANNING_FIELD_ORDER: readonly PlanningField[] = [
  'title',
  'technicianId',
  'supervisorId',
  'scheduledDate',
  'priority',
  'instructions',
]

export function validatePlanning(values: PlanningValues): PlanningErrors {
  const errors: PlanningErrors = {}

  const title = validateTitle(values.title)
  if (title) errors.title = title

  if (!filled(values.technicianId)) errors.technicianId = 'A atribuição do técnico é obrigatória.'

  const scheduledDate = validateScheduledDate(values.scheduledDate)
  if (scheduledDate) errors.scheduledDate = scheduledDate

  if (!isInspectionPriority(values.priority)) errors.priority = 'Selecione a prioridade.'

  const instructions = validateInstructions(values.instructions)
  if (instructions) errors.instructions = instructions

  return errors
}

export function hasPlanningErrors(errors: PlanningErrors): boolean {
  return Object.values(errors).some(Boolean)
}

export function firstInvalidPlanningField(errors: PlanningErrors): PlanningField | null {
  return PLANNING_FIELD_ORDER.find((field) => errors[field]) ?? null
}
