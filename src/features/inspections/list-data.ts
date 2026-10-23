import 'server-only'

import { loadActiveUsers, loadClients } from '@/features/catalog/lookups'
import { filterParams } from '@/features/inspections/list-filters'
import { demoInspections } from '@/features/inspections/list-fixture'
import { load } from '@/lib/dal'
import {
  AWAITING_REVIEW,
  dayInSaoPaulo,
  isOverdue,
  type InspectionFilters,
  type InspectionListItem,
} from '@/lib/domain/inspection-list'
import { DEFAULT_PAGE_SIZE, type Page } from '@/lib/domain/page'

export type FilterOption = { readonly value: string; readonly label: string }

export type InspectionFilterOptions = {
  readonly technicians: readonly FilterOption[]
  readonly clients: readonly FilterOption[]
}

function usesDemoInspections(): boolean {
  return process.env.NEXT_PUBLIC_APP_ENV === 'development'
}

/** Busca sem diferenciar maiusculas nem acentos. */
function normalize(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

export function matchesFilters(item: InspectionListItem, filters: InspectionFilters, today: string): boolean {
  if (filters.q) {
    const haystack = normalize(
      [item.code, item.title, item.clientName, item.siteName, item.equipmentName ?? '', item.technicianName ?? ''].join(' '),
    )
    if (!haystack.includes(normalize(filters.q))) return false
  }
  if (filters.status && item.status !== filters.status) return false
  if (filters.technicianId && item.technicianId !== filters.technicianId) return false
  if (filters.clientId && item.clientId !== filters.clientId) return false
  if (filters.priority && item.priority !== filters.priority) return false
  if (filters.date && dayInSaoPaulo(item.scheduledFor) !== filters.date) return false
  if (filters.overdue && !isOverdue(item, today)) return false
  if (filters.review && !AWAITING_REVIEW.includes(item.status)) return false
  return true
}

export function paginate<T>(items: readonly T[], page: number, size: number): Page<T> {
  const totalPages = Math.max(Math.ceil(items.length / size), 1)
  const current = Math.min(Math.max(page, 0), totalPages - 1)
  return {
    content: items.slice(current * size, current * size + size),
    page: current,
    size,
    totalElements: items.length,
    totalPages,
    first: current === 0,
    last: current >= totalPages - 1,
  }
}

/**
 * Pagina do acompanhamento. Com a API, os filtros seguem como parametros de
 * `GET /inspections` (paginado no servidor, issue #17); em desenvolvimento,
 * enquanto o endpoint nao existe, as inspecoes de demonstracao passam pelos
 * mesmos filtros aqui.
 */
export async function loadInspectionPage(
  filters: InspectionFilters,
  page: number,
  size: number = DEFAULT_PAGE_SIZE,
): Promise<Page<InspectionListItem>> {
  if (usesDemoInspections()) {
    const today = dayInSaoPaulo(new Date())
    const items = demoInspections()
      .filter((item) => matchesFilters(item, filters, today))
      .toSorted((a, b) => a.scheduledFor.localeCompare(b.scheduledFor))
    return paginate(items, page, size)
  }

  return load<Page<InspectionListItem>>('/inspections', {
    ...filterParams(filters),
    page,
    size,
    sort: 'scheduledFor,asc',
  })
}

/** Opcoes dos seletores de tecnico e cliente, coerentes com os dados mostrados. */
export async function loadInspectionFilterOptions(): Promise<InspectionFilterOptions> {
  if (usesDemoInspections()) {
    const items = demoInspections()
    const unique = (entries: readonly (FilterOption | null)[]) =>
      [...new Map(entries.flatMap((entry) => (entry ? [[entry.value, entry] as const] : []))).values()].sort((a, b) =>
        a.label.localeCompare(b.label, 'pt-BR'),
      )
    return {
      technicians: unique(
        items.map((item) => (item.technicianId && item.technicianName ? { value: item.technicianId, label: item.technicianName } : null)),
      ),
      clients: unique(items.map((item) => ({ value: item.clientId, label: item.clientName }))),
    }
  }

  const [technicians, clients] = await Promise.all([loadActiveUsers('TECHNICIAN'), loadClients()])
  return {
    technicians: technicians.map((user) => ({ value: user.id, label: user.name })),
    clients: clients.map((client) => ({ value: client.id, label: client.name })),
  }
}
