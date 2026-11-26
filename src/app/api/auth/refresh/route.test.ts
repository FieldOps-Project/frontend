import { http, HttpResponse } from 'msw'
import { NextRequest } from 'next/server'
import { describe, expect, it, vi } from 'vitest'

import { GET } from '@/app/api/auth/refresh/route'
import { API, fail, mockApi, server } from '@/test/api'
import { cookieJar, outcome, withSession } from '@/test/next'

vi.mock('server-only', () => ({}))
vi.mock('next/headers', async () => (await import('@/test/next')).nextHeaders)
vi.mock('next/navigation', async () => (await import('@/test/next')).nextNavigation)

mockApi()

function renewal(redirectTo = '/clients?page=2') {
  return new NextRequest(new URL(`/api/auth/refresh?redirect=${encodeURIComponent(redirectTo)}`, 'http://localhost:3000'))
}

describe('GET /api/auth/refresh', () => {
  it('renova a sessao e devolve a pessoa ao destino', async () => {
    withSession()
    server.use(
      http.post(`${API}/auth/refresh`, () =>
        HttpResponse.json({ accessToken: 'new-access', refreshToken: 'new-refresh', expiresIn: 900 }),
      ),
    )

    expect(await outcome(() => GET(renewal()))).toEqual({ redirectedTo: '/clients?page=2' })
    expect(cookieJar.get('fo_rf')).toBe('1')
  })

  it('refresh token recusado leva ao login com o destino preservado', async () => {
    withSession()
    server.use(fail('post', '/auth/refresh', 401, 'AUTH_INVALID_REFRESH_TOKEN'))

    expect(await outcome(() => GET(renewal()))).toEqual({
      redirectedTo: '/login?expired=1&redirect=%2Fclients%3Fpage%3D2',
    })
  })

  it('conta inativa leva ao login com o aviso de conta inativa', async () => {
    withSession()
    server.use(fail('post', '/auth/refresh', 401, 'AUTH_USER_INACTIVE'))

    expect((await outcome(() => GET(renewal()))).redirectedTo).toMatch(/^\/login\?inactive=1/)
  })

  it('API fora do ar leva ao login sem apagar a sessao', async () => {
    withSession()
    server.use(fail('post', '/auth/refresh', 503, 'INTERNAL_ERROR'))

    expect((await outcome(() => GET(renewal()))).redirectedTo).toMatch(/^\/login\?unavailable=1/)
    expect(cookieJar.get('fo_rt')).toBe('refresh-token')
  })
})
