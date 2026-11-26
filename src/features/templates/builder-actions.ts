'use server'

import { hasErrors, validateItem, validateSection } from '@/features/templates/builder-validation'
import type { BuilderResult, PublishResult } from '@/features/templates/builder-result'
import { hasNewTemplateErrors, validateNewTemplate } from '@/features/templates/new-template-validation'
import { publicationIssues } from '@/features/templates/publication-check'
import { loadTemplateDetail } from '@/features/templates/templates-data'
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
  type TemplateVersionSummary,
} from '@/lib/domain/template-builder'
import { issuesFromApi } from '@/lib/domain/template-publication'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { submittedValues, text } from '@/lib/form-data'
import type { FormState } from '@/lib/form-state'
import { assertId } from '@/lib/ids'

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
    await send(`/inspection-templates/${templateId}`, { method: 'PUT', body: input })
  } catch (error) {
    return formError(error, submittedValues(formData))
  }

  return { status: 'success', message: 'Dados do modelo salvos.' }
}

function rejected(error: unknown): BuilderResult<never> {
  if (isApiError(error)) return { ok: false, message: messageFor(error), fieldErrors: fieldErrorsFor(error) }
  throw error
}

function sectionInput(values: { title?: string | null; description?: string | null }): SectionInput {
  return { title: values.title?.trim() ?? '', description: values.description?.trim() || null }
}

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
    const section = await send<TemplateSection>(`/inspection-templates/${templateId}/sections`, { method: 'POST', body: input })
    return { ok: true, message: `Seção “${section.title}” adicionada.`, data: section }
  } catch (error) {
    return rejected(error)
  }
}

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
    const saved = await send<TemplateSection>(`/inspection-templates/${templateId}/sections/${section}`, {
      method: 'PUT',
      body: input,
    })
    return { ok: true, message: 'Seção salva.', data: saved }
  } catch (error) {
    return rejected(error)
  }
}

export async function deleteSection(id: string, sectionId: string): Promise<BuilderResult> {
  await requireRole(MANAGER_ROLES)
  const templateId = assertId(id)
  const section = assertId(sectionId)

  try {
    await send(`/inspection-templates/${templateId}/sections/${section}`, { method: 'DELETE' })
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
      code: values.code?.trim() || null,
      title: values.title.trim(),
      description: values.description?.trim() || null,
    }),
  }
}

export async function createItem(id: string, sectionId: string, values: ItemInput): Promise<BuilderResult<TemplateItem>> {
  await requireRole(MANAGER_ROLES)
  const templateId = assertId(id)
  const section = assertId(sectionId)

  const checked = checkedItem(values)
  if ('result' in checked) return checked.result

  try {
    const item = await send<TemplateItem>(`/inspection-templates/${templateId}/sections/${section}/items`, {
      method: 'POST',
      body: checked.input,
    })
    return { ok: true, message: 'Item adicionado.', data: item }
  } catch (error) {
    return rejected(error)
  }
}

export async function updateItem(id: string, itemId: string, values: ItemInput): Promise<BuilderResult<TemplateItem>> {
  await requireRole(MANAGER_ROLES)
  const templateId = assertId(id)
  const item = assertId(itemId)

  const checked = checkedItem(values)
  if ('result' in checked) return checked.result

  try {
    const saved = await send<TemplateItem>(`/inspection-templates/${templateId}/items/${item}`, {
      method: 'PUT',
      body: checked.input,
    })
    return { ok: true, message: 'Item salvo.', data: saved }
  } catch (error) {
    return rejected(error)
  }
}

export async function deleteItem(id: string, itemId: string): Promise<BuilderResult> {
  await requireRole(MANAGER_ROLES)
  const templateId = assertId(id)
  const item = assertId(itemId)

  try {
    await send(`/inspection-templates/${templateId}/items/${item}`, { method: 'DELETE' })
    return { ok: true, message: 'Item excluído.', data: undefined }
  } catch (error) {
    return rejected(error)
  }
}

export async function reorderSections(id: string, sectionIds: readonly string[]): Promise<BuilderResult> {
  await requireRole(MANAGER_ROLES)
  const templateId = assertId(id)
  const ids = sectionIds.map(assertId)

  try {
    await send(`/inspection-templates/${templateId}/sections/order`, { method: 'PUT', body: { sectionIds: ids } })
    return { ok: true, message: 'Ordem das seções salva.', data: undefined }
  } catch (error) {
    return rejected(error)
  }
}

export async function reorderItems(id: string, sectionId: string, itemIds: readonly string[]): Promise<BuilderResult> {
  await requireRole(MANAGER_ROLES)
  const templateId = assertId(id)
  const section = assertId(sectionId)
  const ids = itemIds.map(assertId)

  try {
    await send(`/inspection-templates/${templateId}/sections/${section}/items/order`, {
      method: 'PUT',
      body: { itemIds: ids },
    })
    return { ok: true, message: 'Ordem dos itens salva.', data: undefined }
  } catch (error) {
    return rejected(error)
  }
}

export async function publishTemplate(id: string): Promise<PublishResult> {
  await requireRole(MANAGER_ROLES)
  const templateId = assertId(id)
  const template = await loadTemplateDetail(templateId)

  const local = publicationIssues(template)
  if (local.length > 0) {
    return { ok: false, message: 'O modelo tem pendências que impedem a publicação.', issues: local }
  }

  try {
    const version = await send<TemplateVersionSummary>(`/inspection-templates/${templateId}/publish`, { method: 'POST' })
    return { ok: true, message: `Versão ${version.versionNumber} publicada.`, versionNumber: version.versionNumber }
  } catch (error) {
    if (isApiError(error)) {
      const issues = error.code === 'TEMPLATE_PUBLISH_INVALID' ? issuesFromApi(error.fieldErrors, template) : []
      return { ok: false, message: messageFor(error), issues }
    }
    throw error
  }
}
