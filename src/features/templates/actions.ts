'use server'

import { redirect } from 'next/navigation'

import { hasNewTemplateErrors, validateNewTemplate, type NewTemplateErrors } from '@/features/templates/new-template-validation'
import { changeDemoTemplateStatus, createDemoTemplate, DemoTemplateError } from '@/features/templates/template-demo-store'
import { usesDemoTemplates } from '@/features/templates/templates-data'
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

/**
 * Cria o modelo em rascunho e abre o construtor (issue #13: "rascunho recem-
 * criado abre direto no construtor").
 *
 * Revalida no servidor -- a Server Action e ponto de entrada publico -- e a API
 * decide por ultimo: titulo repetido volta como erro no campo
 * (`409 TEMPLATE_TITLE_ALREADY_EXISTS`).
 */
export async function createTemplate(_previous: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole(MANAGER_ROLES)

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

  if (usesDemoTemplates()) {
    templateId = createDemoTemplate(input, user.id).id
  } else {
    try {
      const created = await send<{ id: string }>('/inspection-templates', { method: 'POST', body: input })
      templateId = created.id
    } catch (error) {
      return formError(error, submittedValues(formData))
    }
  }

  redirect(`/inspection-templates/${templateId}/edit?notice=created`)
}

const STATUS_MESSAGES = {
  ACTIVE: 'Modelo reativado: as versões disponíveis voltam a aceitar novos agendamentos.',
  INACTIVE: 'Modelo inativado. As inspeções existentes não foram afetadas.',
} as const

/**
 * Inativa ou reativa um modelo ja publicado (`PATCH /inspection-templates/{id}/status`).
 * Inativar nao afeta inspecoes existentes (RN-022); a API recusa rascunho
 * nunca publicado (`422 TEMPLATE_NOT_PUBLISHED`).
 */
export async function changeTemplateStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<ActionResult> {
  await requireRole(MANAGER_ROLES)
  const templateId = assertId(id)

  if (status !== 'ACTIVE' && status !== 'INACTIVE') {
    return { ok: false, message: 'Situação inválida.' }
  }

  if (usesDemoTemplates()) {
    try {
      changeDemoTemplateStatus(templateId, status)
    } catch (error) {
      if (error instanceof DemoTemplateError) return { ok: false, message: error.message }
      throw error
    }
    return { ok: true, message: STATUS_MESSAGES[status] }
  }

  try {
    await send(`/inspection-templates/${templateId}/status`, { method: 'PATCH', body: { status } })
  } catch (error) {
    return actionError(error)
  }

  return { ok: true, message: STATUS_MESSAGES[status] }
}
