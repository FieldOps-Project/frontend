'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { isDemoInspection, loadInspectionDetail, loadPlanningPeople } from '@/features/inspections/detail-data'
import { recordDemoInspectionChange } from '@/features/inspections/inspection-demo-store'
import {
  hasPlanningErrors,
  validatePlanning,
  type PlanningErrors,
  type PlanningField,
  type PlanningValues,
} from '@/features/inspections/planning-validation'
import { formError, requireRole, send } from '@/lib/dal'
import {
  canEditPlanning,
  scheduledDateInSaoPaulo,
  type UpdateInspectionPlanningRequest,
} from '@/lib/domain/inspection-detail'
import { INSPECTION_PRIORITY_LABELS, scheduledForFromDate, type InspectionPriority } from '@/lib/domain/inspection-scheduling'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { submittedValues, text } from '@/lib/form-data'
import type { FormState } from '@/lib/form-state'
import { assertId } from '@/lib/ids'

const FIELDS: readonly PlanningField[] = ['technicianId', 'supervisorId', 'scheduledDate', 'priority', 'instructions']

function readValues(formData: FormData): PlanningValues {
  return Object.fromEntries(FIELDS.map((field) => [field, text(formData, field) ?? undefined]))
}

function invalid(fieldErrors: PlanningErrors, formData: FormData, message = 'Revise os campos destacados.'): FormState {
  return { status: 'error', message, fieldErrors: fieldErrors as Record<string, string>, values: submittedValues(formData) }
}

/**
 * Salva o planejamento (documento 14.9, issue #18) com `PUT /inspections/{id}`.
 *
 * So aceita enquanto a execucao nao comecou: a tela ja esconde a edicao depois
 * disso, e a acao confere de novo, porque Server Action e ponto de entrada
 * publico. Tecnico e supervisor precisam estar ativos (RN-027).
 */
export async function updateInspectionPlanning(id: string, _previous: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole(MANAGER_ROLES)
  const inspectionId = assertId(id)
  const values = readValues(formData)

  const errors = validatePlanning(values)
  if (hasPlanningErrors(errors)) {
    return invalid(errors, formData)
  }

  const [inspection, people] = await Promise.all([loadInspectionDetail(inspectionId), loadPlanningPeople(inspectionId)])

  if (!canEditPlanning(inspection.status)) {
    return invalid({}, formData, 'O planejamento não pode mais ser alterado: a execução já foi iniciada.')
  }

  const technician = people.technicians.find((person) => person.id === values.technicianId)
  const supervisor = values.supervisorId ? people.supervisors.find((person) => person.id === values.supervisorId) : null
  if (!technician) errors.technicianId = 'Somente técnico ativo pode receber a inspeção.'
  if (supervisor === undefined) errors.supervisorId = 'Supervisor inativo ou inexistente.'
  if (hasPlanningErrors(errors) || !technician) {
    return invalid(errors, formData)
  }

  const body: UpdateInspectionPlanningRequest = {
    technicianId: technician.id,
    supervisorId: supervisor?.id ?? null,
    // O formulario so tem a data: se ela nao mudou, o horario agendado fica como estava.
    scheduledFor:
      values.scheduledDate === scheduledDateInSaoPaulo(inspection.scheduledFor)
        ? inspection.scheduledFor
        : scheduledForFromDate(values.scheduledDate as string),
    priority: values.priority as InspectionPriority,
    instructions: values.instructions ?? null,
  }

  if (isDemoInspection(inspectionId)) {
    const now = new Date().toISOString()
    const assigning = inspection.status === 'DRAFT'
    recordDemoInspectionChange(
      inspectionId,
      {
        status: assigning ? 'ASSIGNED' : inspection.status,
        technicianId: technician.id,
        technicianName: technician.name,
        supervisorId: supervisor?.id ?? null,
        supervisorName: supervisor?.name ?? null,
        scheduledFor: body.scheduledFor,
        priority: body.priority,
        instructions: body.instructions,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        action: assigning ? 'INSPECTION_ASSIGNED' : 'INSPECTION_UPDATED',
        actorName: user.name,
        occurredAt: now,
        deviceOccurredAt: null,
        previousStatus: assigning ? 'DRAFT' : null,
        newStatus: assigning ? 'ASSIGNED' : null,
        note: `Técnico: ${technician.name} · prioridade ${INSPECTION_PRIORITY_LABELS[body.priority].toLowerCase()}`,
      },
    )
  } else {
    try {
      await send(`/inspections/${inspectionId}`, { method: 'PUT', body })
    } catch (error) {
      return formError(error, submittedValues(formData))
    }
  }

  revalidatePath(`/inspections/${inspectionId}`)
  revalidatePath('/inspections')
  redirect(`/inspections/${inspectionId}?notice=updated`)
}
