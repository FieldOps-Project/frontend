import { describe, expect, it } from 'vitest'

import {
  activeTotal,
  emptyStatusCounts,
  hasNoInspections,
  overdueDelta,
  overdueDeltaLabel,
} from '@/lib/domain/dashboard'

describe('totais por estado', () => {
  it('comeca com todos os estados zerados', () => {
    const counts = emptyStatusCounts()
    expect(Object.values(counts)).toHaveLength(8)
    expect(Object.values(counts).every((value) => value === 0)).toBe(true)
  })

  it('soma no total ativo tudo menos aprovadas e canceladas', () => {
    const counts = { ...emptyStatusCounts(), DRAFT: 2, ASSIGNED: 3, IN_PROGRESS: 4, REJECTED: 1, APPROVED: 50, CANCELED: 7 }
    expect(activeTotal(counts)).toBe(10)
  })

  it('reconhece operacao sem nenhuma inspecao', () => {
    expect(hasNoInspections(emptyStatusCounts())).toBe(true)
    expect(hasNoInspections({ ...emptyStatusCounts(), CANCELED: 1 })).toBe(false)
  })
})

describe('variacao das atrasadas', () => {
  it('compara com o fim do dia anterior', () => {
    expect(overdueDelta({ overdue: 18, overdueYesterday: 15 })).toBe(3)
    expect(overdueDelta({ overdue: 4, overdueYesterday: 6 })).toBe(-2)
  })

  it('escreve o sinal e o caso sem variacao', () => {
    expect(overdueDeltaLabel(3)).toBe('+3 desde ontem')
    expect(overdueDeltaLabel(-2)).toBe('−2 desde ontem')
    expect(overdueDeltaLabel(0)).toBe('Sem variação desde ontem')
  })
})
