'use server'

import { redirect } from 'next/navigation'

import { hasNewTemplateErrors, validateNewTemplate, type NewTemplateErrors } from '@/features/templates/new-template-validation'
import { createDemoTemplate } from '@/features/templates/template-demo-store'
import { usesDemoTemplates } from '@/features/templates/templates-data'
import { formError, requireRole, send } from '@/lib/dal'
import type { NewTemplateInput } from '@/lib/domain/inspection-template'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { submittedValues, text } from '@/lib/form-data'
import type { FormState } from '@/lib/form-state'

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
