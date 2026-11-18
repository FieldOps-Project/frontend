import { describe, expect, it } from 'vitest'

import { auditActionLabel, auditActionTone, entityHref, periodStart } from '@/lib/domain/audit'

describe('auditoria', () => {
  it('traduz as acoes para linguagem de negocio e mantem as desconhecidas', () => {
    expect(auditActionLabel('INSPECTION_SUBMITTED')).toBe('Sincronização confirmada')
    expect(auditActionLabel('EVIDENCE_ADDED')).toBe('Fotografia capturada')
    expect(auditActionLabel('ALGO_NOVO')).toBe('ALGO_NOVO')
  })

  it('pinta o selo como o Stitch: aprovacao azul, cancelamento vermelho, edicao cinza', () => {
    expect(auditActionTone('INSPECTION_APPROVED')).toBe('info')
    expect(auditActionTone('INSPECTION_CANCELED')).toBe('danger')
    expect(auditActionTone('RECORD_UPDATED')).toBe('neutral')
  })

  it('calcula o inicio do periodo no fuso da operacao', () => {
    expect(periodStart('today', '2026-11-18')).toBe('2026-11-18')
    expect(periodStart('7d', '2026-11-18')).toBe('2026-11-12')
    expect(periodStart('all', '2026-11-18')).toBeNull()
  })

  it('leva ao registro afetado quando o painel tem pagina para ele', () => {
    expect(entityHref({ entityType: 'INSPECTION', entityId: 'i1' })).toBe('/inspections/i1')
    expect(entityHref({ entityType: 'REPORT', entityId: 'r1' })).toBeNull()
  })
})
