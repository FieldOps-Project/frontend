import { describe, expect, it } from 'vitest'

import {
  dayInSaoPaulo,
  daysOverdue,
  dueLabel,
  initials,
  isAwaitingReview,
  isOverdue,
  progressPercent,
} from '@/lib/domain/inspection-list'

const TODAY = '2026-10-23'

describe('atraso', () => {
  it('conta os dias de atraso de inspecao ainda com o tecnico', () => {
    expect(daysOverdue({ status: 'ASSIGNED', scheduledFor: '2026-10-21T12:00:00-03:00' }, TODAY)).toBe(2)
    expect(isOverdue({ status: 'IN_PROGRESS', scheduledFor: '2026-10-22T09:00:00-03:00' }, TODAY)).toBe(true)
  })

  it('nao considera atrasada a inspecao do dia nem a ja enviada ou aprovada', () => {
    expect(isOverdue({ status: 'ASSIGNED', scheduledFor: '2026-10-23T08:00:00-03:00' }, TODAY)).toBe(false)
    expect(isOverdue({ status: 'SUBMITTED', scheduledFor: '2026-10-01T08:00:00-03:00' }, TODAY)).toBe(false)
    expect(isOverdue({ status: 'APPROVED', scheduledFor: '2026-10-01T08:00:00-03:00' }, TODAY)).toBe(false)
  })

  it('usa o dia de Sao Paulo, nao o de UTC', () => {
    expect(dayInSaoPaulo('2026-10-24T01:30:00Z')).toBe('2026-10-23')
  })
})

describe('dueLabel', () => {
  it('descreve atraso, hoje, amanha e dias restantes', () => {
    expect(dueLabel({ status: 'ASSIGNED', scheduledFor: '2026-10-21T09:00:00-03:00' }, TODAY)).toBe('Atrasado (2 dias)')
    expect(dueLabel({ status: 'ASSIGNED', scheduledFor: '2026-10-22T09:00:00-03:00' }, TODAY)).toBe('Atrasado (1 dia)')
    expect(dueLabel({ status: 'ASSIGNED', scheduledFor: '2026-10-23T14:00:00-03:00' }, TODAY)).toBe('Hoje, 14:00')
    expect(dueLabel({ status: 'ASSIGNED', scheduledFor: '2026-10-24T09:00:00-03:00' }, TODAY)).toBe('Amanhã')
    expect(dueLabel({ status: 'ASSIGNED', scheduledFor: '2026-10-26T09:00:00-03:00' }, TODAY)).toBe('Em 3 dias')
  })

  it('nao complementa data passada de inspecao que ja saiu do tecnico', () => {
    expect(dueLabel({ status: 'APPROVED', scheduledFor: '2026-10-01T09:00:00-03:00' }, TODAY)).toBeNull()
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
