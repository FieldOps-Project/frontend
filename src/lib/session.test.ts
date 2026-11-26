import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { fail, mockApi, API, server } from '@/test/api'
import { cookieJar, withSession } from '@/test/next'
import { refreshTokens } from '@/lib/session'

vi.mock('server-only', () => ({}))
vi.mock('next/headers', async () => (await import('@/test/next')).nextHeaders)
vi.mock('next/navigation', async () => (await import('@/test/next')).nextNavigation)

mockApi()

const NEW_TOKENS = { accessToken: 'new-access', refreshToken: 'new-refresh', expiresIn: 900 }

function countingRefresh() {
  const state = { calls: 0 }
  const handler = http.post(`${API}/auth/refresh`, async () => {
    state.calls += 1
    await new Promise((resolve) => setTimeout(resolve, 10))
    return HttpResponse.json(NEW_TOKENS)
  })
  return { state, handler }
}

describe('refreshTokens', () => {
  it('grava o novo par de tokens quando a API renova', async () => {
    withSession()
    const refresh = countingRefresh()
    server.use(refresh.handler)

    expect(await refreshTokens()).toEqual({ kind: 'renewed', tokens: NEW_TOKENS })
    expect(cookieJar.get('fo_at')).toBe('new-access')
    expect(cookieJar.get('fo_rt')).toBe('new-refresh')
  })

  it('renovacoes simultaneas do mesmo refresh token chamam a API uma unica vez', async () => {
    withSession()
    const refresh = countingRefresh()
    server.use(refresh.handler)

    const outcomes = await Promise.all([refreshTokens(), refreshTokens(), refreshTokens()])

    expect(refresh.state.calls).toBe(1)
    expect(outcomes.every((outcome) => outcome.kind === 'renewed')).toBe(true)
  })

  it('depois de terminar, uma nova renovacao volta a chamar a API', async () => {
    withSession()
    const refresh = countingRefresh()
    server.use(refresh.handler)

    await refreshTokens()
    cookieJar.set('fo_rt', 'refresh-token')
    await refreshTokens()

    expect(refresh.state.calls).toBe(2)
  })

  it('sem refresh token a sessao acabou e a API nao e chamada', async () => {
    cookieJar.clear()

    expect(await refreshTokens()).toEqual({ kind: 'ended', inactive: false })
  })

  it('refresh token recusado (401) encerra a sessao e limpa os cookies', async () => {
    withSession()
    server.use(fail('post', '/auth/refresh', 401, 'AUTH_INVALID_REFRESH_TOKEN'))

    expect(await refreshTokens()).toEqual({ kind: 'ended', inactive: false })
    expect(cookieJar.has('fo_at')).toBe(false)
    expect(cookieJar.has('fo_rt')).toBe(false)
  })

  it('usuario inativo na renovacao e sinalizado para mostrar a mensagem de conta inativa', async () => {
    withSession()
    server.use(fail('post', '/auth/refresh', 401, 'AUTH_USER_INACTIVE'))

    expect(await refreshTokens()).toEqual({ kind: 'ended', inactive: true })
  })

  it('erro 5xx da API sobe sem apagar a sessao', async () => {
    withSession()
    server.use(fail('post', '/auth/refresh', 500, 'INTERNAL_ERROR'))

    await expect(refreshTokens()).rejects.toMatchObject({ status: 500 })
    expect(cookieJar.get('fo_rt')).toBe('refresh-token')
  })

  it('API fora do ar sobe sem apagar a sessao', async () => {
    withSession()
    server.use(http.post(`${API}/auth/refresh`, () => HttpResponse.error()))

    await expect(refreshTokens()).rejects.toMatchObject({ code: 'NETWORK_ERROR' })
    expect(cookieJar.get('fo_rt')).toBe('refresh-token')
  })
})
