import { beforeEach, describe, expect, it, vi } from 'vitest'

import { load, loadIfPermitted, loadOptional, send } from '@/lib/dal'
import { capture, fail, mockApi, ok, server } from '@/test/api'
import { cookieJar, outcome, withSession } from '@/test/next'

vi.mock('server-only', () => ({}))
vi.mock('next/headers', async () => (await import('@/test/next')).nextHeaders)
vi.mock('next/navigation', async () => (await import('@/test/next')).nextNavigation)

mockApi()

beforeEach(() => withSession())

describe('loadIfPermitted', () => {
  it('devolve o corpo quando a API responde', async () => {
    server.use(ok('get', '/dashboard/summary', { awaitingReview: 2 }))

    expect(await loadIfPermitted('/dashboard/summary')).toEqual({ awaitingReview: 2 })
  })

  it('perfil sem permissao (403) vira null, para o bloco nao aparecer', async () => {
    server.use(fail('get', '/audit-events', 403, 'AUTH_FORBIDDEN'))

    expect(await loadIfPermitted('/audit-events')).toBeNull()
  })

  it('recurso inexistente (404) vira null', async () => {
    server.use(fail('get', '/inspections/x/history', 404, 'INSPECTION_NOT_FOUND'))

    expect(await loadIfPermitted('/inspections/x/history')).toBeNull()
  })

  it('token recusado (401) leva a renovacao da sessao', async () => {
    server.use(fail('get', '/audit-events', 401, 'AUTH_INVALID_TOKEN'))

    expect(await outcome(() => loadIfPermitted('/audit-events'))).toEqual({
      redirectedTo: '/api/auth/refresh?redirect=%2Fdashboard',
    })
  })

  it('erro da API continua subindo', async () => {
    server.use(fail('get', '/audit-events', 500, 'INTERNAL_ERROR'))

    await expect(loadIfPermitted('/audit-events')).rejects.toMatchObject({ status: 500 })
  })
})

describe('loadOptional', () => {
  it('404 vira null e 403 continua indo para acesso negado', async () => {
    server.use(fail('get', '/a', 404, 'X_NOT_FOUND'), fail('get', '/b', 403, 'AUTH_FORBIDDEN'))

    expect(await loadOptional('/a')).toBeNull()
    expect(await outcome(() => loadOptional('/b'))).toEqual({ redirectedTo: '/forbidden' })
  })
})

describe('load', () => {
  it('404 vira a pagina de nao encontrado', async () => {
    server.use(fail('get', '/a', 404, 'X_NOT_FOUND'))

    expect(await outcome(() => load('/a'))).toEqual({ notFound: true })
  })
})

describe('send', () => {
  it('renova a sessao e repete a escrita uma unica vez quando o token expirou', async () => {
    const write = capture('post', '/clients', { id: 'c-1' }, 201)
    server.use(
      ok('post', '/auth/refresh', { accessToken: 'novo', refreshToken: 'novo-rt', expiresIn: 900 }),
      write.handler,
    )
    cookieJar.delete('fo_at')

    const created = await send<{ id: string }>('/clients', { method: 'POST', body: { name: 'A' } })

    expect(created).toEqual({ id: 'c-1' })
    expect(write.bodies).toEqual([{ name: 'A' }])
    expect(cookieJar.get('fo_at')).toBe('novo')
  })

  it('refresh token recusado leva ao login', async () => {
    server.use(fail('post', '/auth/refresh', 401, 'AUTH_INVALID_REFRESH_TOKEN'))
    cookieJar.delete('fo_at')

    expect(await outcome(() => send('/clients', { method: 'POST', body: {} }))).toEqual({
      redirectedTo: '/login?expired=1',
    })
  })

  it('conta inativa na renovacao leva ao login com o aviso de conta inativa', async () => {
    server.use(fail('post', '/auth/refresh', 401, 'AUTH_USER_INACTIVE'))
    cookieJar.delete('fo_at')

    expect(await outcome(() => send('/clients', { method: 'POST', body: {} }))).toEqual({
      redirectedTo: '/login?inactive=1',
    })
  })

  it('falha da API ao renovar sobe como erro e nao derruba a sessao', async () => {
    server.use(fail('post', '/auth/refresh', 503, 'INTERNAL_ERROR'))
    cookieJar.delete('fo_at')

    await expect(send('/clients', { method: 'POST', body: {} })).rejects.toMatchObject({ status: 503 })
    expect(cookieJar.get('fo_rt')).toBe('refresh-token')
  })
})
