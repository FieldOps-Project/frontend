import { describe, expect, it } from 'vitest'

import { formatRecentDate } from '@/lib/format'

const NOW = new Date('2026-11-09T15:00:00-03:00')

describe('formatRecentDate', () => {
  it('mostra o horario quando o registro e de hoje', () => {
    expect(formatRecentDate('2026-11-09T09:45:00-03:00', NOW)).toBe('Hoje, 09:45')
  })

  it('usa o dia de Sao Paulo, nao o de UTC', () => {
    // 01:30 UTC do dia 10 ainda e dia 9 em Sao Paulo.
    expect(formatRecentDate('2026-11-10T01:30:00Z', NOW)).toBe('Hoje, 22:30')
  })

  it('diz ontem para o dia anterior', () => {
    expect(formatRecentDate('2026-11-08T18:00:00-03:00', NOW)).toBe('Ontem')
  })

  it('escreve a data por extenso para dias mais antigos', () => {
    expect(formatRecentDate('2023-10-24T10:00:00-03:00', NOW)).toBe('24 de out. de 2023')
  })

  it('devolve traco para valor ausente ou invalido', () => {
    expect(formatRecentDate(null, NOW)).toBe('—')
    expect(formatRecentDate('não é data', NOW)).toBe('—')
  })
})
