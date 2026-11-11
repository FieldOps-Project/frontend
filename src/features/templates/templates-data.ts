import 'server-only'

import { notFound } from 'next/navigation'

import { paginate } from '@/features/inspections/list-data'
import { demoTemplateCategories, findDemoTemplate, listDemoTemplates } from '@/features/templates/template-demo-store'
import {
  demoDraftSections,
  demoPublisherName,
  demoTemplateVersion,
  demoTemplateVersions,
} from '@/features/templates/template-draft-demo-store'
import { load, loadOptional } from '@/lib/dal'
import type { InspectionTemplate, TemplateFilters } from '@/lib/domain/inspection-template'
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, type Page } from '@/lib/domain/page'
import type { InspectionTemplateDetail, TemplateVersionSummary } from '@/lib/domain/template-builder'
import type { TemplateVersionDetail } from '@/lib/domain/template-publication'
import type { User } from '@/lib/domain/user'
import { isId } from '@/lib/ids'

export function usesDemoTemplates(): boolean {
  return process.env.NEXT_PUBLIC_APP_ENV === 'development'
}

/** Mais recentemente alterado primeiro, nos dois caminhos. */
const SORT = 'updatedAt,desc'

/**
 * Pagina da listagem de modelos (issue #13). Com a API, os filtros seguem como
 * parametros de `GET /inspection-templates` (paginado no servidor); em
 * desenvolvimento, enquanto a API local nao tem o endpoint, os modelos de
 * demonstracao passam pelas mesmas regras de filtro.
 */
export async function loadTemplatePage(
  filters: TemplateFilters,
  page: number,
  size: number = DEFAULT_PAGE_SIZE,
): Promise<Page<InspectionTemplate>> {
  if (usesDemoTemplates()) {
    return paginate(listDemoTemplates(filters), page, size)
  }

  return load<Page<InspectionTemplate>>('/inspection-templates', { ...filters, page, size, sort: SORT })
}

/**
 * Categorias ja usadas, para o filtro e as sugestoes do cadastro. A API nao tem
 * lista de categorias (o campo e texto livre); elas saem dos modelos
 * cadastrados, ate o limite de uma pagina da API.
 */
export async function loadTemplateCategories(): Promise<readonly string[]> {
  if (usesDemoTemplates()) {
    return demoTemplateCategories()
  }

  const page = await load<Page<InspectionTemplate>>('/inspection-templates', { size: MAX_PAGE_SIZE, sort: 'category,asc' })
  return [...new Set(page.content.map((template) => template.category))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

/**
 * Um modelo pelo identificador. Identificador malformado ou desconhecido vira
 * 404 da rota, como na API (`GET /inspection-templates/{id}`).
 */
export async function loadTemplate(templateId: string): Promise<InspectionTemplate> {
  if (!isId(templateId)) notFound()

  if (usesDemoTemplates()) {
    return findDemoTemplate(templateId) ?? notFound()
  }

  return load<InspectionTemplate>(`/inspection-templates/${templateId}`)
}

/**
 * Modelo com o rascunho em edicao (secoes e itens em ordem), para o construtor
 * (issue #14). Mesmo 404 de `loadTemplate` para identificador desconhecido.
 */
export async function loadTemplateDetail(templateId: string): Promise<InspectionTemplateDetail> {
  if (!isId(templateId)) notFound()

  if (usesDemoTemplates()) {
    const template = findDemoTemplate(templateId) ?? notFound()
    return { ...template, draftVersionId: null, sections: demoDraftSections(templateId) }
  }

  return load<InspectionTemplateDetail>(`/inspection-templates/${templateId}`)
}

/** Versoes publicadas, mais nova primeiro (`GET /inspection-templates/{id}/versions`). */
export async function loadTemplateVersions(templateId: string): Promise<readonly TemplateVersionSummary[]> {
  if (!isId(templateId)) notFound()

  if (usesDemoTemplates()) {
    return demoTemplateVersions(templateId)
  }

  return load<readonly TemplateVersionSummary[]>(`/inspection-templates/${templateId}/versions`)
}

/**
 * Versao publicada com o conteudo congelado
 * (`GET /inspection-template-versions/{versionId}`). Versao de outro modelo
 * responde 404, como identificador desconhecido.
 */
export async function loadTemplateVersion(templateId: string, versionId: string): Promise<TemplateVersionDetail> {
  if (!isId(templateId) || !isId(versionId)) notFound()

  const version = usesDemoTemplates()
    ? demoTemplateVersion(versionId)
    : await load<TemplateVersionDetail>(`/inspection-template-versions/${versionId}`)

  if (!version || version.templateId !== templateId) notFound()
  return version
}

/**
 * Nome de quem publicou cada versao. A API devolve so o identificador
 * (`publishedBy`); o nome vem de `GET /users/{id}`. Usuario que nao se consegue
 * ler fica sem nome, sem derrubar a tela.
 */
export async function loadPublisherNames(
  userIds: readonly (string | null)[],
  currentUser: { readonly id: string; readonly name: string },
): Promise<ReadonlyMap<string, string>> {
  const ids = [...new Set(userIds.filter((id): id is string => id !== null))]
  const names = new Map<string, string>()

  for (const id of ids) {
    if (id === currentUser.id) {
      names.set(id, currentUser.name)
      continue
    }
    if (usesDemoTemplates()) {
      const name = demoPublisherName(id)
      if (name) names.set(id, name)
    }
  }

  if (!usesDemoTemplates()) {
    const pending = ids.filter((id) => !names.has(id) && isId(id))
    const users = await Promise.all(pending.map((id) => loadOptional<User>(`/users/${id}`)))
    users.forEach((user) => {
      if (user) names.set(user.id, user.name)
    })
  }

  return names
}
