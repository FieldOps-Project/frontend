import { describe, expect, it } from 'vitest'

import { DEFAULT_REDIRECT_TARGET, safeRedirectTarget } from '@/features/auth/redirect-target'

describe('safeRedirectTarget', () => {
  it('devolve a pessoa ao caminho interno de onde ela veio', () => {
    expect(safeRedirectTarget('/inspections/abc/review')).toBe('/inspections/abc/review')
    expect(safeRedirectTarget('/users?status=ACTIVE&page=2')).toBe('/users?status=ACTIVE&page=2')
  })

  it('usa o painel inicial quando nao ha destino', () => {
    expect(safeRedirectTarget(undefined)).toBe(DEFAULT_REDIRECT_TARGET)
    expect(safeRedirectTarget(null)).toBe(DEFAULT_REDIRECT_TARGET)
    expect(safeRedirectTarget('')).toBe(DEFAULT_REDIRECT_TARGET)
  })

  it.each([
    'https://golpe.com',
    'javascript:alert(1)',
    '//golpe.com',
    '/\\golpe.com',
    'dashboard',
  ])('recusa destino fora da aplicacao: %s', (value) => {
    expect(safeRedirectTarget(value)).toBe(DEFAULT_REDIRECT_TARGET)
  })

  it('recusa o proprio login, para nao criar laco', () => {
    expect(safeRedirectTarget('/login')).toBe(DEFAULT_REDIRECT_TARGET)
    expect(safeRedirectTarget('/login?redirect=/users')).toBe(DEFAULT_REDIRECT_TARGET)
  })
})
