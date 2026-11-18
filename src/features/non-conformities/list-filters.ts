import { SEVERITIES } from '@/lib/domain/inspection-review'
import type { NonConformityFilters } from '@/lib/domain/non-conformity'
import { oneOf, param, type RawSearchParams } from '@/lib/search-params'

const DATE = /^\d{4}-\d{2}-\d{2}$/

function day(params: RawSearchParams, key: string): string | undefined {
  const value = param(params, key)
  return value && DATE.test(value) ? value : undefined
}

/** Filtros da URL (`?severity=HIGH&from=...`), ignorando valor desconhecido. */
export function parseNonConformityFilters(params: RawSearchParams): NonConformityFilters {
  return {
    severity: oneOf(params, 'severity', SEVERITIES),
    clientId: param(params, 'clientId'),
    from: day(params, 'from'),
    to: day(params, 'to'),
  }
}

/** Filtros de volta para a URL e para a API, so com o que esta preenchido. */
export function filterParams(filters: NonConformityFilters): Record<string, string | undefined> {
  return { severity: filters.severity, clientId: filters.clientId, from: filters.from, to: filters.to }
}

export function hasActiveFilters(filters: NonConformityFilters): boolean {
  return Boolean(filters.severity || filters.clientId || filters.from || filters.to)
}
