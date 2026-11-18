import 'server-only'

import { notFound } from 'next/navigation'

import { loadClients } from '@/features/catalog/lookups'
import { paginate } from '@/features/inspections/list-data'
import { filterParams } from '@/features/non-conformities/list-filters'
import { demoNonConformities } from '@/features/non-conformities/non-conformity-fixture'
import { load, loadOptional } from '@/lib/dal'
import { dayInSaoPaulo } from '@/lib/domain/inspection-list'
import {
  bySeverityDesc,
  type NonConformityDetail,
  type NonConformityFilters,
  type NonConformityListItem,
} from '@/lib/domain/non-conformity'
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, type Page } from '@/lib/domain/page'

export type FilterOption = { readonly value: string; readonly label: string }

/**
 * Ordem padrao: criticidade decrescente, depois a mais recente (issue #20). A
 * API precisa ordenar pelo peso da criticidade, nao pelo texto do enum -- em
 * ordem alfabetica, CRITICAL ficaria por ultimo -- e desempatar pela data de
 * campo. Esse requisito vai junto do pedido do endpoint (backend #23).
 */
const DEFAULT_SORT = 'severity,desc'

function usesDemo(): boolean {
  return process.env.NEXT_PUBLIC_APP_ENV === 'development'
}

export function isDemoNonConformities(): boolean {
  return usesDemo()
}

export function matchesFilters(item: NonConformityListItem, filters: NonConformityFilters): boolean {
  if (filters.severity && item.severity !== filters.severity) return false
  if (filters.clientId && item.clientId !== filters.clientId) return false
  const day = dayInSaoPaulo(item.createdAtDevice)
  if (filters.from && day < filters.from) return false
  if (filters.to && day > filters.to) return false
  return true
}

function toListItem(detail: NonConformityDetail): NonConformityListItem {
  return {
    id: detail.id,
    title: detail.title,
    description: detail.description,
    severity: detail.severity,
    status: detail.status,
    inspectionId: detail.inspectionId,
    inspectionCode: detail.inspectionCode,
    clientId: detail.clientId,
    clientName: detail.clientName,
    siteName: detail.siteName,
    equipmentName: detail.equipmentName,
    itemCode: detail.itemCode,
    itemTitle: detail.itemTitle,
    createdByName: detail.createdByName,
    createdAtDevice: detail.createdAtDevice,
    serverReceivedAt: detail.serverReceivedAt,
  }
}

/**
 * Pagina da listagem geral. Com a API, os filtros seguem como parametros de
 * `GET /non-conformities` (paginado no servidor); em desenvolvimento as nao
 * conformidades de demonstracao passam pelos mesmos filtros e pela mesma ordem.
 * Este arquivo e o unico ponto de troca para a API. Enquanto o endpoint nao
 * existir, devolve `null` e a tela mostra a listagem como indisponivel.
 */
export async function loadNonConformityPage(
  filters: NonConformityFilters,
  page: number,
  size: number = DEFAULT_PAGE_SIZE,
): Promise<Page<NonConformityListItem> | null> {
  if (usesDemo()) {
    const items = demoNonConformities()
      .map(toListItem)
      .filter((item) => matchesFilters(item, filters))
      .toSorted(bySeverityDesc)
    return paginate(items, page, size)
  }

  return loadOptional<Page<NonConformityListItem>>('/non-conformities', {
    ...filterParams(filters),
    page,
    size,
    sort: DEFAULT_SORT,
  })
}

export async function loadNonConformity(id: string): Promise<NonConformityDetail> {
  if (usesDemo()) {
    return demoNonConformities().find((item) => item.id === id) ?? notFound()
  }
  return load<NonConformityDetail>(`/non-conformities/${id}`)
}

/**
 * Nao conformidades de uma inspecao, para o bloco do detalhe (RN-052). Se a API
 * nao responder, devolve `null` e so o bloco aparece como indisponivel.
 */
export async function loadInspectionNonConformities(inspectionId: string): Promise<readonly NonConformityListItem[] | null> {
  if (usesDemo()) {
    return demoNonConformities()
      .filter((item) => item.inspectionId === inspectionId)
      .map(toListItem)
      .toSorted(bySeverityDesc)
  }
  const page = await loadOptional<Page<NonConformityListItem>>('/non-conformities', {
    inspectionId,
    size: MAX_PAGE_SIZE,
    sort: DEFAULT_SORT,
  })
  return page ? page.content.toSorted(bySeverityDesc) : null
}

/** Clientes do seletor, coerentes com os dados mostrados. */
export async function loadClientOptions(): Promise<readonly FilterOption[]> {
  if (usesDemo()) {
    const clients = new Map(demoNonConformities().map((item) => [item.clientId, item.clientName]))
    return [...clients]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
  }
  const clients = await loadClients()
  return clients.map((client) => ({ value: client.id, label: client.name }))
}
