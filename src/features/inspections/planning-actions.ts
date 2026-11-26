'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { withFormFieldNames } from '@/features/inspections/api-field-names'
import { loadInspectionRecord } from '@/features/inspections/detail-data'
import {
  hasPlanningErrors,
  validatePlanning,
  type PlanningErrors,
  type PlanningField,
  type PlanningValues,
} from '@/features/inspections/planning-validation'
import { formError, requireRole, send } from '@/lib/dal'
import { scheduledDateInSaoPaulo, type UpdateInspectionPlanningRequest } from '@/lib/domain/inspection-detail'
import { scheduledForFromDate, type InspectionPriority } from '@/lib/domain/inspection-scheduling'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { submittedValues, text } from '@/lib/form-data'
import type { FormState } from '@/lib/form-state'
import { assertId } from '@/lib/ids'

const FIELDS: readonly PlanningField[] = ['title', 'technicianId', 'supervisorId', 'scheduledDate', 'priority', 'instructions']

function readValues(formData: FormData): PlanningValues {
  return Object.fromEntries(FIELDS.map((field) => [field, text(formData, field) ?? undefined]))
}

function invalid(fieldErrors: PlanningErrors, formData: FormData): FormState {
  return {
    status: 'error',
    message: 'Revise os campos destacados.',
    fieldErrors: fieldErrors as Record<string, string>,
    values: submittedValues(formData),
  }
}

export async function updateInspectionPlanning(id: string, _previous: FormState, formData: FormData): Promise<FormState> {
  await requireRole(MANAGER_ROLES)
  const inspectionId = assertId(id)
  const values = readValues(formData)

  const errors = validatePlanning(values)
  if (hasPlanningErrors(errors)) {
    return invalid(errors, formData)
  }

  const inspection = await loadInspectionRecord(inspectionId)
  const dateUnchanged = values.scheduledDate === scheduledDateInSaoPaulo(inspection.scheduledFor)

  const body: UpdateInspectionPlanningRequest = {
    clientId: inspection.clientId,
    siteId: inspection.siteId,
    equipmentId: inspection.equipmentId,
    technicianId: values.technicianId as string,
    supervisorId: values.supervisorId ?? null,
    title: values.title as string,
    instructions: values.instructions ?? null,
    priority: values.priority as InspectionPriority,
    scheduledFor: dateUnchanged ? inspection.scheduledFor : scheduledForFromDate(values.scheduledDate as string),
  }

  try {
    await send(`/inspections/${inspectionId}`, { method: 'PUT', body })
  } catch (error) {
    return withFormFieldNames(formError(error, submittedValues(formData)))
  }

  revalidatePath(`/inspections/${inspectionId}`)
  revalidatePath('/inspections')
  redirect(`/inspections/${inspectionId}?notice=updated`)
}
