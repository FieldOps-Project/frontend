import 'server-only'

import { loadActiveUsers, loadClients } from '@/features/catalog/lookups'
import { apiFilterQuery } from '@/features/inspections/list-filters'
import { load } from '@/lib/dal'
import type { InspectionFilters, InspectionListItem } from '@/lib/domain/inspection-list'
import { DEFAULT_PAGE_SIZE, type Page } from '@/lib/domain/page'

export type FilterOption = { readonly value: string; readonly label: string }

export type InspectionFilterOptions = {
  readonly technicians: readonly FilterOption[]
  readonly clients: readonly FilterOption[]
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

export async function loadInspectionPage(
  filters: InspectionFilters,
  page: number,
  size: number = DEFAULT_PAGE_SIZE,
): Promise<Page<InspectionListItem>> {
  return load<Page<InspectionListItem>>('/inspections', {
    ...apiFilterQuery(filters),
    page,
    size,
    sort: 'scheduledFor,asc',
  })
}

export async function loadInspectionFilterOptions(): Promise<InspectionFilterOptions> {
  const [technicians, clients] = await Promise.all([loadActiveUsers('TECHNICIAN'), loadClients()])
  return {
    technicians: technicians.map((user) => ({ value: user.id, label: user.name })),
    clients: clients.map((client) => ({ value: client.id, label: client.name })),
  }
}
