import {
  AUDIT_ENTITY_TYPES,
  AUDIT_PERIODS,
  DEFAULT_AUDIT_PERIOD,
  type AuditFilters,
} from '@/lib/domain/audit'
import { idParam, oneOf, param, type RawSearchParams } from '@/lib/search-params'

export type AuditQuery = {
  readonly inspectionId?: string
  readonly recent: boolean
  readonly filters: AuditFilters
}

export type UrlParams = Record<string, string | undefined>

export function parseAuditQuery(params: RawSearchParams): AuditQuery {
  return {
    inspectionId: idParam(params, 'inspectionId'),
    recent: param(params, 'scope') === 'recent',
    filters: {
      period: oneOf(params, 'period', AUDIT_PERIODS) ?? DEFAULT_AUDIT_PERIOD,
      actorId: param(params, 'actorId'),
      entityType: oneOf(params, 'entityType', AUDIT_ENTITY_TYPES),
      action: param(params, 'action'),
    },
  }
}

export function auditTargetParams(query: Pick<AuditQuery, 'inspectionId' | 'recent'>): UrlParams {
  if (query.inspectionId) return { inspectionId: query.inspectionId }
  return { scope: query.recent ? 'recent' : undefined }
}

export function auditFilterParams(filters: AuditFilters): UrlParams {
  return {
    period: filters.period === DEFAULT_AUDIT_PERIOD ? undefined : filters.period,
    actorId: filters.actorId,
    entityType: filters.entityType,
    action: filters.action,
  }
}

export function hasActiveAuditFilters(filters: AuditFilters): boolean {
  return Object.values(auditFilterParams(filters)).some(Boolean)
}
