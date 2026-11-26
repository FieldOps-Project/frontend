'use server'

import { redirect } from 'next/navigation'

import { withFormFieldNames } from '@/features/inspections/api-field-names'
import {
  hasScheduleErrors,
  validateSchedule,
  type ScheduleErrors,
  type ScheduleValues,
} from '@/features/inspections/schedule-validation'
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
  'title',
  'scheduledDate',
  'priority',
  'instructions',
] as const

const EQUIPMENT_RULE_DECIDED_BY_API = { requiresEquipment: false }

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

export async function createInspection(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireRole(MANAGER_ROLES)
  const values = readValues(formData)

  const errors = validateSchedule(values, EQUIPMENT_RULE_DECIDED_BY_API)
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
    title: values.title as string,
    instructions: values.instructions ?? null,
    priority: isInspectionPriority(values.priority) ? values.priority : DEFAULT_INSPECTION_PRIORITY,
    scheduledFor: scheduledForFromDate(values.scheduledDate as string),
  }

  try {
    await send('/inspections', { method: 'POST', body })
  } catch (error) {
    return withFormFieldNames(formError(error, submittedValues(formData)))
  }

  redirect('/inspections?notice=scheduled')
}
