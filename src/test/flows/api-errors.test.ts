import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { changeClientStatus, createClient } from '@/features/clients/actions'
import { load } from '@/lib/dal'
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/session-cookies'
import { ADMIN, api, API_BASE_URL, apiError, recordRequests, server, signedInAs } from '@/test/api-server'
import { clearCookies, outcome, setCookie } from '@/test/next-server'

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/headers', async () => {
  const next = await import('@/test/next-server')
  return { cookies: async () => next.cookiesStore, headers: async () => new Headers({ 'x-fo-pathname': '/clients' }) }
})
vi.mock('next/navigation', async () => (await import('@/test/next-server')).navigation)

/**
 * Fluxo 11 do documento 14.16: tratamento de erro da API (401, 403, 409 e 422).
 * Tudo passa pelo codigo real -- Server Action, `dal`, `apiFetch` e sessao --;
 * so a resposta HTTP e simulada.
 */
const CLIENT_ID = 'b0000000-0000-4000-8000-000000000001'

function clientForm(values: Record<string, string>): FormData {
  const form = new FormData()
  for (const [name, value] of Object.entries(values)) form.set(name, value)
  return form
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

beforeEach(() => {
  vi.stubEnv('API_BASE_URL', API_BASE_URL)
  setCookie(ACCESS_TOKEN_COOKIE, 'token-valido')
  server.use(signedInAs(ADMIN))
})

afterEach(() => {
  server.resetHandlers()
  server.events.removeAllListeners()
  clearCookies()
  vi.unstubAllEnvs()
})

describe('422: validacao da API', () => {
  it('leva cada erro ao campo certo, com mensagem de negocio', async () => {
    server.use(
      http.post(api('/clients'), () =>
        apiError(422, 'VALIDATION_ERROR', [{ field: 'name', message: 'must not be blank' }]),
      ),
    )

    const { value } = await outcome(() => createClient({ status: 'idle' }, clientForm({ name: ' ', email: 'x@y.com' })))

    expect(value).toMatchObject({ status: 'error', message: 'Revise os campos destacados.' })
    expect(value?.status === 'error' && value.fieldErrors.name).toBeTruthy()
    expect(value?.status === 'error' && value.values.email).toBe('x@y.com')
  })
})

describe('409: conflito', () => {
  it('leva o e-mail duplicado ao campo de e-mail, sem a mensagem tecnica', async () => {
    server.use(http.post(api('/clients'), () => apiError(409, 'EMAIL_ALREADY_EXISTS')))

    const { value } = await outcome(() => createClient({ status: 'idle' }, clientForm({ name: 'Alpha', email: 'dup@alpha.com' })))

    expect(value?.status === 'error' && value.fieldErrors.email).toBe('Este e-mail já está cadastrado.')
    expect(JSON.stringify(value)).not.toContain('mensagem tecnica')
  })
})

describe('403: perfil sem permissao', () => {
  it('leitura leva a pagina de acesso negado', async () => {
    server.use(http.get(api('/clients'), () => apiError(403, 'AUTH_FORBIDDEN')))

    expect(await outcome(() => load('/clients'))).toEqual({ redirect: '/forbidden' })
  })

  it('acao de botao devolve a mensagem de negocio', async () => {
    server.use(http.patch(api(`/clients/${CLIENT_ID}/status`), () => apiError(403, 'AUTH_FORBIDDEN')))

    const { value } = await outcome(() => changeClientStatus(CLIENT_ID, 'INACTIVE'))
    expect(value).toEqual({ ok: false, message: 'Seu perfil não tem permissão para esta ação.' })
  })
})

describe('401: sessao expirada', () => {
  it('na escrita, renova a sessao uma unica vez e repete a operacao com o token novo', async () => {
    setCookie(REFRESH_TOKEN_COOKIE, 'refresh-valido')
    const received = recordRequests()
    let attempts = 0
    server.use(
      http.post(api('/clients'), ({ request }) => {
        attempts += 1
        return request.headers.get('Authorization') === 'Bearer token-novo'
          ? HttpResponse.json({ id: CLIENT_ID }, { status: 201 })
          : apiError(401, 'AUTH_TOKEN_EXPIRED')
      }),
      http.post(api('/auth/refresh'), () =>
        HttpResponse.json({ accessToken: 'token-novo', refreshToken: 'refresh-novo', expiresIn: 900 }),
      ),
    )

    const result = await outcome(() => createClient({ status: 'idle' }, clientForm({ name: 'Alpha' })))

    expect(result).toEqual({ redirect: '/clients?notice=created' })
    expect(attempts).toBe(2)
    expect(received.filter((request) => request.path === '/auth/refresh')).toHaveLength(1)
  })

  it('sem refresh token, leva ao login avisando que a sessao expirou', async () => {
    server.use(http.post(api('/clients'), () => apiError(401, 'AUTH_TOKEN_EXPIRED')))

    expect(await outcome(() => createClient({ status: 'idle' }, clientForm({ name: 'Alpha' })))).toEqual({
      redirect: '/login?expired=1',
    })
  })

  it('na leitura, manda renovar e voltar a mesma pagina', async () => {
    server.use(http.get(api('/clients'), () => apiError(401, 'AUTH_TOKEN_EXPIRED')))

    const { redirect } = await outcome(() => load('/clients'))
    expect(redirect).toContain('redirect=%2Fclients')
  })
})
