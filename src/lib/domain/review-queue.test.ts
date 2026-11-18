import { describe, expect, it } from 'vitest'

import { isWaitingLong, waitingLabel } from '@/lib/domain/review-queue'

const NOW = new Date('2026-11-18T12:00:00Z')

describe('waitingLabel', () => {
  it('fala o tempo de espera em linguagem natural', () => {
    expect(waitingLabel('2026-11-18T11:59:40Z', NOW)).toBe('agora mesmo')
    expect(waitingLabel('2026-11-18T11:45:00Z', NOW)).toBe('há 15 minutos')
    expect(waitingLabel('2026-11-18T09:00:00Z', NOW)).toBe('há 3 horas')
    expect(waitingLabel('2026-11-17T10:00:00Z', NOW)).toBe('há 1 dia')
    expect(waitingLabel('2026-11-16T10:00:00Z', NOW)).toBe('há 2 dias')
  })
})

describe('isWaitingLong', () => {
  it('destaca o que espera ha mais de um dia', () => {
    expect(isWaitingLong('2026-11-18T09:00:00Z', NOW)).toBe(false)
    expect(isWaitingLong('2026-11-17T10:00:00Z', NOW)).toBe(true)
  })
})
