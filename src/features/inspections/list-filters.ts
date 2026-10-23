import { INSPECTION_STATUSES } from '@/lib/domain/inspection'
import type { InspectionFilters } from '@/lib/domain/inspection-list'
import { INSPECTION_PRIORITIES } from '@/lib/domain/inspection-scheduling'
import { oneOf, param, type RawSearchParams } from '@/lib/search-params'

const DATE = /^\d{4}-\d{2}-\d{2}$/

/** Filtros da URL (`?status=...&overdue=1`), ignorando valor desconhecido. */
export function parseInspectionFilters(params: RawSearchParams): InspectionFilters {
  const date = param(params, 'date')
  return {
    q: param(params, 'q'),
    status: oneOf(params, 'status', INSPECTION_STATUSES),
    technicianId: param(params, 'technicianId'),
    clientId: param(params, 'clientId'),
    priority: oneOf(params, 'priority', INSPECTION_PRIORITIES),
    date: date && DATE.test(date) ? date : undefined,
    overdue: param(params, 'overdue') === '1',
    review: param(params, 'review') === '1',
  }
}

/** Filtros de volta para a URL, so com o que esta preenchido. */
export function filterParams(filters: InspectionFilters): Record<string, string | undefined> {
  return {
    q: filters.q,
    status: filters.status,
    technicianId: filters.technicianId,
    clientId: filters.clientId,
    priority: filters.priority,
    date: filters.date,
    overdue: filters.overdue ? '1' : undefined,
    review: filters.review ? '1' : undefined,
  }
}

export function hasActiveFilters(filters: InspectionFilters): boolean {
  return Object.values(filterParams(filters)).some(Boolean)
}
