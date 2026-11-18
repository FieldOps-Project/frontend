import {
  AUDIT_ENTITY_TYPES,
  AUDIT_PERIODS,
  DEFAULT_AUDIT_PERIOD,
  type AuditFilters,
} from '@/lib/domain/audit'
import { oneOf, param, type RawSearchParams } from '@/lib/search-params'

/** Filtros da URL (`?period=30d&action=...`), ignorando valor desconhecido. */
export function parseAuditFilters(params: RawSearchParams): AuditFilters {
  return {
    period: oneOf(params, 'period', AUDIT_PERIODS) ?? DEFAULT_AUDIT_PERIOD,
    actorId: param(params, 'actorId'),
    entityType: oneOf(params, 'entityType', AUDIT_ENTITY_TYPES),
    action: param(params, 'action'),
    inspectionId: param(params, 'inspectionId'),
  }
}

/** Filtros de volta para a URL; o periodo padrao fica de fora para o endereco ficar limpo. */
export function auditFilterParams(filters: AuditFilters): Record<string, string | undefined> {
  return {
    period: filters.period === DEFAULT_AUDIT_PERIOD ? undefined : filters.period,
    actorId: filters.actorId,
    entityType: filters.entityType,
    action: filters.action,
    inspectionId: filters.inspectionId,
  }
}

export function hasActiveAuditFilters(filters: AuditFilters): boolean {
  return Object.values(auditFilterParams(filters)).some(Boolean)
}
