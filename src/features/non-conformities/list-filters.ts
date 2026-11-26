import { SEVERITIES } from '@/lib/domain/inspection-review'
import type { NonConformityFilters } from '@/lib/domain/non-conformity'
import { oneOf, param, type RawSearchParams } from '@/lib/search-params'

export function parseNonConformityFilters(params: RawSearchParams): NonConformityFilters {
  return {
    severity: oneOf(params, 'severity', SEVERITIES),
    clientId: param(params, 'clientId'),
  }
}

export function filterParams(filters: NonConformityFilters): Record<string, string | undefined> {
  return { severity: filters.severity, clientId: filters.clientId }
}

export function hasActiveFilters(filters: NonConformityFilters): boolean {
  return Boolean(filters.severity || filters.clientId)
}
