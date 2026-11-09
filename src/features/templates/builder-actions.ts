'use server'

import { hasNewTemplateErrors, validateNewTemplate } from '@/features/templates/new-template-validation'
import { DemoTemplateError, updateDemoTemplate } from '@/features/templates/template-demo-store'
import { usesDemoTemplates } from '@/features/templates/templates-data'
import { formError, requireRole, send } from '@/lib/dal'
import type { NewTemplateInput } from '@/lib/domain/inspection-template'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { submittedValues, text } from '@/lib/form-data'
import type { FormState } from '@/lib/form-state'
import { assertId } from '@/lib/ids'

/*
 * Acoes do construtor de modelo (issue #14). Cada operacao salva na hora e
 * devolve uma mensagem explicita: o supervisor precisa saber que a alteracao
 * foi persistida. Em desenvolvimento gravam na demonstracao; nos demais
 * ambientes chamam os endpoints de rascunho da API (backend#13).
 */

/** Dados do modelo: titulo, descricao e categoria (`PUT /inspection-templates/{id}`). */
export async function updateTemplateInfo(id: string, _previous: FormState, formData: FormData): Promise<FormState> {
  await requireRole(MANAGER_ROLES)
  const templateId = assertId(id)

  const input: NewTemplateInput = {
    title: text(formData, 'title') ?? '',
    description: text(formData, 'description'),
    category: text(formData, 'category') ?? '',
  }

  const errors = validateNewTemplate({ title: input.title, description: input.description ?? undefined, category: input.category })
  if (hasNewTemplateErrors(errors)) {
    return {
      status: 'error',
      message: 'Revise os campos destacados.',
      fieldErrors: errors as Record<string, string>,
      values: submittedValues(formData),
    }
  }

  try {
    if (usesDemoTemplates()) updateDemoTemplate(templateId, input)
    else await send(`/inspection-templates/${templateId}`, { method: 'PUT', body: input })
  } catch (error) {
    if (error instanceof DemoTemplateError) {
      return { status: 'error', message: error.message, fieldErrors: {}, values: submittedValues(formData) }
    }
    return formError(error, submittedValues(formData))
  }

  return { status: 'success', message: 'Dados do modelo salvos.' }
}
