import { describe, expect, it } from 'vitest'

import {
  dayInSaoPaulo,
  dayRangeInSaoPaulo,
  dueLabel,
  initials,
  isAwaitingReview,
  progressPercent,
} from '@/lib/domain/inspection-list'

const TODAY = '2026-10-23'

describe('dia de Sao Paulo', () => {
  it('usa o dia de Sao Paulo, nao o de UTC', () => {
    expect(dayInSaoPaulo('2026-10-24T01:30:00Z')).toBe('2026-10-23')
  })

  it('cobre o dia inteiro com instantes no fuso de Sao Paulo', () => {
    expect(dayRangeInSaoPaulo('2026-11-23')).toEqual({
      from: '2026-11-23T00:00:00-03:00',
      to: '2026-11-23T23:59:59.999-03:00',
    })
  })
})

describe('dueLabel', () => {
  it('marca atrasada sem contar dias quando a API sinaliza atraso', () => {
    expect(dueLabel({ scheduledFor: '2026-10-21T09:00:00-03:00', overdue: true }, TODAY)).toBe('Atrasada')
  })

  it('descreve hoje, amanha e dias restantes', () => {
    expect(dueLabel({ scheduledFor: '2026-10-23T14:00:00-03:00', overdue: false }, TODAY)).toBe('Hoje, 14:00')
    expect(dueLabel({ scheduledFor: '2026-10-24T09:00:00-03:00', overdue: false }, TODAY)).toBe('Amanhã')
    expect(dueLabel({ scheduledFor: '2026-10-26T09:00:00-03:00', overdue: false }, TODAY)).toBe('Em 3 dias')
  })

  it('nao complementa data passada que a API nao considera atrasada', () => {
    expect(dueLabel({ scheduledFor: '2026-10-01T09:00:00-03:00', overdue: false }, TODAY)).toBeNull()
  })
})

describe('progresso e apoio', () => {
  it('mede respondidos sobre aplicaveis (RN-040)', () => {
    expect(progressPercent({ answeredItems: 21, applicableItems: 42 })).toBe(50)
    expect(progressPercent({ answeredItems: 0, applicableItems: 0 })).toBe(0)
  })

  it('reconhece o recorte aguardando revisao', () => {
    expect(isAwaitingReview({ status: 'SUBMITTED' })).toBe(true)
    expect(isAwaitingReview({ status: 'UNDER_REVIEW' })).toBe(true)
    expect(isAwaitingReview({ status: 'APPROVED' })).toBe(false)
  })

  it('monta as iniciais do avatar', () => {
    expect(initials('Carlos Silva')).toBe('CS')
    expect(initials('Ana Paula de Souza')).toBe('AS')
    expect(initials('Ana')).toBe('A')
  })
})
