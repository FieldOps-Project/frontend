import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'

import { proxy } from '@/proxy'

/**
 * Item 1 dos onze testes prioritarios do documento 14.16: protecao de rota sem
 * sessao. E o defeito que passa despercebido em navegacao manual, porque quem
 * testa costuma estar autenticado.
 */
function requestFor(pathname: string, cookies?: Record<string, string>) {
  const request = new NextRequest(new URL(pathname, 'http://localhost:3000'))
  for (const [name, value] of Object.entries(cookies ?? {})) {
    request.cookies.set(name, value)
  }
  return request
}

describe('proxy', () => {
  it('desvia para o login quando nao ha cookie de sessao', () => {
    const response = proxy(requestFor('/inspections'))
    const location = new URL(response.headers.get('location') ?? '')

    expect(response.status).toBe(307)
    expect(location.pathname).toBe('/login')
  })

  it('preserva o destino pretendido para o login devolver a pessoa ao lugar certo', () => {
    const response = proxy(requestFor('/inspections/abc/review'))
    const location = new URL(response.headers.get('location') ?? '')

    expect(location.searchParams.get('redirect')).toBe('/inspections/abc/review')
  })

  it('deixa passar quem ja tem sessao', () => {
    const response = proxy(requestFor('/inspections', { fo_at: 'token' }))

    expect(response.headers.get('location')).toBeNull()
  })

  it('nao desvia a propria rota de login, para nao criar laco de redirecionamento', () => {
    const response = proxy(requestFor('/login'))

    expect(response.headers.get('location')).toBeNull()
  })
})
