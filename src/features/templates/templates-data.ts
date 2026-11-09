import 'server-only'

import { notFound } from 'next/navigation'

import { paginate } from '@/features/inspections/list-data'
import { demoTemplateCategories, findDemoTemplate, listDemoTemplates } from '@/features/templates/template-demo-store'
import { load } from '@/lib/dal'
import type { InspectionTemplate, TemplateFilters } from '@/lib/domain/inspection-template'
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, type Page } from '@/lib/domain/page'
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
