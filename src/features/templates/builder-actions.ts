'use server'

import { hasErrors, validateItem, validateSection } from '@/features/templates/builder-validation'
import type { BuilderResult } from '@/features/templates/builder-result'
import { hasNewTemplateErrors, validateNewTemplate } from '@/features/templates/new-template-validation'
import { DemoTemplateError, updateDemoTemplate } from '@/features/templates/template-demo-store'
import {
  createDemoItem,
  createDemoSection,
  deleteDemoItem,
  deleteDemoSection,
  updateDemoItem,
  updateDemoSection,
} from '@/features/templates/template-draft-demo-store'
import { usesDemoTemplates } from '@/features/templates/templates-data'
import { isApiError } from '@/lib/api/errors'
import { fieldErrorsFor, messageFor } from '@/lib/api/messages'
import { formError, requireRole, send } from '@/lib/dal'
import type { NewTemplateInput } from '@/lib/domain/inspection-template'
import {
  normalizeItemForType,
  type ItemInput,
  type SectionInput,
  type TemplateItem,
  type TemplateSection,
} from '@/lib/domain/template-builder'
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

function checkedItem(values: ItemInput): { input: ItemInput } | { result: BuilderResult<never> } {
  const errors = validateItem(values)
  if (hasErrors(errors)) {
    return { result: { ok: false, message: 'Revise os campos destacados do item.', fieldErrors: errors as Record<string, string> } }
  }
  return {
    input: normalizeItemForType({
      ...values,
      title: values.title.trim(),
      description: values.description?.trim() || null,
    }),
  }
}

/** Novo item no fim da secao (`POST /inspection-templates/{id}/sections/{sectionId}/items`). */
export async function createItem(id: string, sectionId: string, values: ItemInput): Promise<BuilderResult<TemplateItem>> {
  await requireRole(MANAGER_ROLES)
  const templateId = assertId(id)
  const section = assertId(sectionId)

  const checked = checkedItem(values)
  if ('result' in checked) return checked.result

  try {
    const item = usesDemoTemplates()
      ? createDemoItem(templateId, section, checked.input)
      : await send<TemplateItem>(`/inspection-templates/${templateId}/sections/${section}/items`, {
          method: 'POST',
          body: checked.input,
        })
    return { ok: true, message: 'Item adicionado.', data: item }
  } catch (error) {
    return rejected(error)
  }
}

/** Salva o item (`PUT /inspection-templates/{id}/items/{itemId}`). */
export async function updateItem(id: string, itemId: string, values: ItemInput): Promise<BuilderResult<TemplateItem>> {
  await requireRole(MANAGER_ROLES)
  const templateId = assertId(id)
  const item = assertId(itemId)

  const checked = checkedItem(values)
  if ('result' in checked) return checked.result

  try {
    const saved = usesDemoTemplates()
      ? updateDemoItem(templateId, item, checked.input)
      : await send<TemplateItem>(`/inspection-templates/${templateId}/items/${item}`, { method: 'PUT', body: checked.input })
    return { ok: true, message: 'Item salvo.', data: saved }
  } catch (error) {
    return rejected(error)
  }
}

/** Exclui o item; os seguintes sobem (`DELETE /inspection-templates/{id}/items/{itemId}`). */
export async function deleteItem(id: string, itemId: string): Promise<BuilderResult> {
  await requireRole(MANAGER_ROLES)
  const templateId = assertId(id)
  const item = assertId(itemId)

  try {
    if (usesDemoTemplates()) deleteDemoItem(templateId, item)
    else await send(`/inspection-templates/${templateId}/items/${item}`, { method: 'DELETE' })
    return { ok: true, message: 'Item excluído.', data: undefined }
  } catch (error) {
    return rejected(error)
  }
}
