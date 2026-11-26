import { INSPECTION_STATUSES } from '@/lib/domain/inspection'
import { dayRangeInSaoPaulo, type InspectionFilters } from '@/lib/domain/inspection-list'
import { INSPECTION_PRIORITIES } from '@/lib/domain/inspection-scheduling'
import { oneOf, param, type RawSearchParams } from '@/lib/search-params'

const DATE = /^\d{4}-\d{2}-\d{2}$/

export function parseInspectionFilters(params: RawSearchParams): InspectionFilters {
  const date = param(params, 'date')
  return {
    search: param(params, 'search'),
    status: oneOf(params, 'status', INSPECTION_STATUSES),
    technicianId: param(params, 'technicianId'),
    clientId: param(params, 'clientId'),
    priority: oneOf(params, 'priority', INSPECTION_PRIORITIES),
    date: date && DATE.test(date) ? date : undefined,
    overdue: param(params, 'overdue') === '1',
  }
}

export function filterParams(filters: InspectionFilters): Record<string, string | undefined> {
  return {
    search: filters.search,
    status: filters.status,
    technicianId: filters.technicianId,
    clientId: filters.clientId,
    priority: filters.priority,
    date: filters.date,
    overdue: filters.overdue ? '1' : undefined,
  }
}

export function apiFilterQuery(filters: InspectionFilters): Record<string, string | undefined> {
  const range = filters.date ? dayRangeInSaoPaulo(filters.date) : undefined
  return {
    search: filters.search,
    status: filters.status,
    technicianId: filters.technicianId,
    clientId: filters.clientId,
    priority: filters.priority,
    overdue: filters.overdue ? 'true' : undefined,
    scheduledFrom: range?.from,
    scheduledTo: range?.to,
  }
}

export function hasActiveFilters(filters: InspectionFilters): boolean {
  return Object.values(filterParams(filters)).some(Boolean)
}
