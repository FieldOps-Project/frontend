import { describe, expect, it } from 'vitest'

import { auditFilterParams, auditTargetParams, hasActiveAuditFilters, parseAuditQuery } from '@/features/audit/audit-filters'

const ID = 'd0000000-0000-4000-8000-000000000503'

describe('parseAuditQuery', () => {
  it('le a inspecao do link de detalhe e o periodo todo como padrao', () => {
    expect(parseAuditQuery({ period: 'all', inspectionId: ID })).toEqual({
      inspectionId: ID,
      recent: false,
      filters: { period: 'all', actorId: undefined, entityType: undefined, action: undefined },
    })
  })

  it('ignora inspecao invalida e valores fora do conjunto', () => {
    const query = parseAuditQuery({ inspectionId: '../users', period: 'ontem', entityType: 'USER', scope: 'recent' })

    expect(query.inspectionId).toBeUndefined()
    expect(query.recent).toBe(true)
    expect(query.filters).toMatchObject({ period: 'all', entityType: undefined })
  })
})

describe('parametros da URL', () => {
  it('mantem o alvo e deixa o periodo padrao de fora', () => {
    expect(auditTargetParams({ inspectionId: ID, recent: true })).toEqual({ inspectionId: ID })
    expect(auditTargetParams({ recent: true })).toEqual({ scope: 'recent' })
    expect(auditFilterParams({ period: 'all', action: 'INSPECTION_APPROVED' })).toMatchObject({
      period: undefined,
      action: 'INSPECTION_APPROVED',
    })
    expect(hasActiveAuditFilters({ period: '7d' })).toBe(true)
    expect(hasActiveAuditFilters({ period: 'all' })).toBe(false)
  })
})
