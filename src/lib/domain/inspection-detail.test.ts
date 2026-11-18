import { describe, expect, it } from 'vitest'

import { INSPECTION_STATUSES, type InspectionStatus } from '@/lib/domain/inspection'
import {
  canCancel,
  canEditPlanning,
  canOpenReview,
  historyActionLabel,
  scheduledDateInSaoPaulo,
} from '@/lib/domain/inspection-detail'

function statusesWhere(rule: (status: InspectionStatus) => boolean): InspectionStatus[] {
  return INSPECTION_STATUSES.filter(rule)
}

describe('acoes conforme o estado', () => {
  it('cancela so nos estados do documento 7.6, nunca aprovada (RN-030)', () => {
    expect(statusesWhere(canCancel)).toEqual(['ASSIGNED', 'IN_PROGRESS', 'REJECTED'])
    expect(canCancel('APPROVED')).toBe(false)
  })

  it('oferece revisao so com a inspecao enviada ou em revisao', () => {
    expect(statusesWhere(canOpenReview)).toEqual(['SUBMITTED', 'UNDER_REVIEW'])
  })

  it('bloqueia a edicao do planejamento depois do inicio da execucao', () => {
    expect(statusesWhere(canEditPlanning)).toEqual(['DRAFT', 'ASSIGNED'])
  })
})

describe('historyActionLabel', () => {
  it('traduz as acoes conhecidas e mantem as desconhecidas como vieram', () => {
    expect(historyActionLabel('INSPECTION_CANCELED')).toBe('Inspeção cancelada')
    expect(historyActionLabel('EVIDENCE_ADDED')).toBe('EVIDENCE_ADDED')
  })
})

describe('scheduledDateInSaoPaulo', () => {
  it('le a data prevista no fuso da operacao, sem pular para o dia seguinte', () => {
    expect(scheduledDateInSaoPaulo('2026-11-18T23:30:00-03:00')).toBe('2026-11-18')
  })
})
