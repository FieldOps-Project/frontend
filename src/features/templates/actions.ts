'use server'

import { redirect } from 'next/navigation'

import { hasNewTemplateErrors, validateNewTemplate, type NewTemplateErrors } from '@/features/templates/new-template-validation'
import { actionError, formError, requireRole, send } from '@/lib/dal'
import type { NewTemplateInput } from '@/lib/domain/inspection-template'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { submittedValues, text } from '@/lib/form-data'
import type { ActionResult, FormState } from '@/lib/form-state'
import { assertId } from '@/lib/ids'

function invalid(fieldErrors: NewTemplateErrors, formData: FormData): FormState {
  return {
    status: 'error',
    message: 'Revise os campos destacados.',
    fieldErrors: fieldErrors as Record<string, string>,
    values: submittedValues(formData),
  }
}

export async function createTemplate(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireRole(MANAGER_ROLES)

  const input: NewTemplateInput = {
    title: text(formData, 'title') ?? '',
    description: text(formData, 'description'),
    category: text(formData, 'category') ?? '',
  }

  const errors = validateNewTemplate({
    title: input.title,
    description: input.description ?? undefined,
    category: input.category,
  })
  if (hasNewTemplateErrors(errors)) {
    return invalid(errors, formData)
  }

  let templateId: string
  try {
    const created = await send<{ id: string }>('/inspection-templates', { method: 'POST', body: input })
    templateId = created.id
  } catch (error) {
    return formError(error, submittedValues(formData))
  }

  redirect(`/inspection-templates/${templateId}/edit?notice=created`)
}

const STATUS_MESSAGES = {
  ACTIVE: 'Modelo reativado: as versões disponíveis voltam a aceitar novos agendamentos.',
  INACTIVE: 'Modelo inativado. As inspeções existentes não foram afetadas.',
} as const

export async function changeTemplateStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<ActionResult> {
  await requireRole(MANAGER_ROLES)
  const templateId = assertId(id)

  if (status !== 'ACTIVE' && status !== 'INACTIVE') {
    return { ok: false, message: 'Situação inválida.' }
  }

  try {
    await send(`/inspection-templates/${templateId}/status`, { method: 'PATCH', body: { status } })
  } catch (error) {
    return actionError(error)
  }

  return { ok: true, message: STATUS_MESSAGES[status] }
}

const AVAILABILITY_MESSAGES = {
  true: 'Versão liberada para novos agendamentos.',
  false: 'Versão retirada dos novos agendamentos. As inspeções existentes não foram afetadas.',
} as const

export async function changeVersionAvailability(versionId: string, active: boolean): Promise<ActionResult> {
  await requireRole(MANAGER_ROLES)
  const id = assertId(versionId)

  if (typeof active !== 'boolean') {
    return { ok: false, message: 'Situação inválida.' }
  }

  try {
    await send(`/inspection-template-versions/${id}/availability`, {
      method: 'PATCH',
      body: { activeForNewInspections: active },
    })
  } catch (error) {
    return actionError(error)
  }

  return { ok: true, message: AVAILABILITY_MESSAGES[`${active}`] }
}
