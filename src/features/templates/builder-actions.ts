'use server'

import { hasErrors, validateSection } from '@/features/templates/builder-validation'
import type { BuilderResult } from '@/features/templates/builder-result'
import { hasNewTemplateErrors, validateNewTemplate } from '@/features/templates/new-template-validation'
import { DemoTemplateError, updateDemoTemplate } from '@/features/templates/template-demo-store'
import {
  createDemoSection,
  deleteDemoSection,
  updateDemoSection,
} from '@/features/templates/template-draft-demo-store'
import { usesDemoTemplates } from '@/features/templates/templates-data'
import { isApiError } from '@/lib/api/errors'
import { fieldErrorsFor, messageFor } from '@/lib/api/messages'
import { formError, requireRole, send } from '@/lib/dal'
import type { NewTemplateInput } from '@/lib/domain/inspection-template'
import type { SectionInput, TemplateSection } from '@/lib/domain/template-builder'
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

/** Recusa da demonstracao ou da API como resultado; outros erros sobem. */
function rejected(error: unknown): BuilderResult<never> {
  if (error instanceof DemoTemplateError) return { ok: false, message: error.message, fieldErrors: {} }
  if (isApiError(error)) return { ok: false, message: messageFor(error), fieldErrors: fieldErrorsFor(error) }
  throw error
}

function sectionInput(values: { title?: string | null; description?: string | null }): SectionInput {
  return { title: values.title?.trim() ?? '', description: values.description?.trim() || null }
}

/** Nova secao no fim do rascunho (`POST /inspection-templates/{id}/sections`). */
export async function createSection(
  id: string,
  values: { title: string; description?: string | null },
): Promise<BuilderResult<TemplateSection>> {
  await requireRole(MANAGER_ROLES)
  const templateId = assertId(id)
  const input = sectionInput(values)

  const errors = validateSection(input)
  if (hasErrors(errors)) return { ok: false, message: 'Revise o título da seção.', fieldErrors: errors as Record<string, string> }

  try {
    const section = usesDemoTemplates()
      ? createDemoSection(templateId, input)
      : await send<TemplateSection>(`/inspection-templates/${templateId}/sections`, { method: 'POST', body: input })
    return { ok: true, message: `Seção “${section.title}” adicionada.`, data: section }
  } catch (error) {
    return rejected(error)
  }
}

/** Renomeia a secao (`PUT /inspection-templates/{id}/sections/{sectionId}`). */
export async function updateSection(
  id: string,
  sectionId: string,
  values: { title: string; description?: string | null },
): Promise<BuilderResult<TemplateSection>> {
  await requireRole(MANAGER_ROLES)
  const templateId = assertId(id)
  const section = assertId(sectionId)
  const input = sectionInput(values)

  const errors = validateSection(input)
  if (hasErrors(errors)) return { ok: false, message: 'Revise o título da seção.', fieldErrors: errors as Record<string, string> }

  try {
    const saved = usesDemoTemplates()
      ? updateDemoSection(templateId, section, input)
      : await send<TemplateSection>(`/inspection-templates/${templateId}/sections/${section}`, { method: 'PUT', body: input })
    return { ok: true, message: 'Seção salva.', data: saved }
  } catch (error) {
    return rejected(error)
  }
}

/** Exclui a secao e os itens dela; as seguintes sobem (`DELETE .../sections/{sectionId}`). */
export async function deleteSection(id: string, sectionId: string): Promise<BuilderResult> {
  await requireRole(MANAGER_ROLES)
  const templateId = assertId(id)
  const section = assertId(sectionId)

  try {
    if (usesDemoTemplates()) deleteDemoSection(templateId, section)
    else await send(`/inspection-templates/${templateId}/sections/${section}`, { method: 'DELETE' })
    return { ok: true, message: 'Seção excluída.', data: undefined }
  } catch (error) {
    return rejected(error)
  }
}
