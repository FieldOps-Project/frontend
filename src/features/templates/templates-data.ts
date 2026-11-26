import 'server-only'

import { notFound } from 'next/navigation'

import { loadAllPages } from '@/features/catalog/lookups'
import { load, loadIfPermitted } from '@/lib/dal'
import type { InspectionTemplate, TemplateFilters } from '@/lib/domain/inspection-template'
import { DEFAULT_PAGE_SIZE, type Page } from '@/lib/domain/page'
import type { InspectionTemplateDetail, TemplateVersionSummary } from '@/lib/domain/template-builder'
import type { TemplateVersionDetail } from '@/lib/domain/template-publication'
import type { User } from '@/lib/domain/user'
import { isId } from '@/lib/ids'

const SORT = 'updatedAt,desc'

export function loadTemplatePage(
  filters: TemplateFilters,
  page: number,
  size: number = DEFAULT_PAGE_SIZE,
): Promise<Page<InspectionTemplate>> {
  return load<Page<InspectionTemplate>>('/inspection-templates', { ...filters, page, size, sort: SORT })
}

export async function loadTemplateCategories(): Promise<readonly string[]> {
  const templates = await loadAllPages<InspectionTemplate>('/inspection-templates', {}, 'category,asc')
  return [...new Set(templates.map((template) => template.category))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

export async function loadTemplate(templateId: string): Promise<InspectionTemplate> {
  if (!isId(templateId)) notFound()
  return load<InspectionTemplate>(`/inspection-templates/${templateId}`)
}

export async function loadTemplateDetail(templateId: string): Promise<InspectionTemplateDetail> {
  if (!isId(templateId)) notFound()
  return load<InspectionTemplateDetail>(`/inspection-templates/${templateId}`)
}

export async function loadTemplateVersions(templateId: string): Promise<readonly TemplateVersionSummary[]> {
  if (!isId(templateId)) notFound()
  return load<readonly TemplateVersionSummary[]>(`/inspection-templates/${templateId}/versions`)
}

export async function loadTemplateVersion(templateId: string, versionId: string): Promise<TemplateVersionDetail> {
  if (!isId(templateId) || !isId(versionId)) notFound()

  const version = await load<TemplateVersionDetail>(`/inspection-template-versions/${versionId}`)
  if (version.templateId !== templateId) notFound()
  return version
}

export async function loadPublisherNames(
  userIds: readonly (string | null)[],
  currentUser: { readonly id: string; readonly name: string },
): Promise<ReadonlyMap<string, string>> {
  const ids = [...new Set(userIds.filter((id): id is string => id !== null && isId(id)))]
  const names = new Map<string, string>()
  const others = ids.filter((id) => id !== currentUser.id)

  if (ids.includes(currentUser.id)) {
    names.set(currentUser.id, currentUser.name)
  }

  const users = await Promise.all(others.map((id) => loadIfPermitted<User>(`/users/${id}`)))
  for (const user of users) {
    if (user) names.set(user.id, user.name)
  }

  return names
}
