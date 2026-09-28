import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AUTH_MESSAGES } from '@/features/auth/error-messages'
import { signIn } from '@/features/auth/login'

vi.mock('server-only', () => ({}))

const cookieJar = new Map<string, { value: string; options: Record<string, unknown> }>()

vi.mock('next/headers', () => ({
  cookies: async () => ({
    set: (name: string, value: string, options: Record<string, unknown>) =>
      cookieJar.set(name, { value, options }),
    get: (name: string) => cookieJar.get(name),
    delete: (name: string) => cookieJar.delete(name),
  }),
}))

class RedirectSignal extends Error {
  constructor(readonly target: string) {
    super(`redirect to ${target}`)
  }
}

vi.mock('next/navigation', () => ({
  redirect: (target: string) => {
    throw new RedirectSignal(target)
  },
}))

/*
 * A API e simulada no nivel do `fetch`, e nao trocando o cliente HTTP por um
 * duplo: assim o codigo real de acesso a dados continua sob teste.
 */
const fetchMock = vi.fn<typeof fetch>()

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function loginSuccess(role: string) {
  return jsonResponse(200, {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresIn: 900,
    user: { id: 'user-id', name: 'Maria Silva', email: 'maria@fieldops.local', role },
  })
}

function form(values: Record<string, string>) {
  const data = new FormData()
  for (const [name, value] of Object.entries(values)) data.set(name, value)
  return data
}

const credentials = { email: 'maria@fieldops.local', password: 'Str0ngP@ssword' }

async function submit(values: Record<string, string>) {
  try {
    return { state: await signIn({}, form(values)) }
  } catch (error) {
    if (error instanceof RedirectSignal) return { redirectedTo: error.target }
    throw error
  }
}

beforeEach(() => {
  vi.stubEnv('API_BASE_URL', 'http://api.test/api/v1')
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  cookieJar.clear()
  fetchMock.mockReset()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('signIn', () => {
  it('grava a sessao em cookies httpOnly e leva ao destino pretendido', async () => {
    fetchMock.mockResolvedValueOnce(loginSuccess('SUPERVISOR'))

    const result = await submit({ ...credentials, redirect: '/inspections' })

    expect(result.redirectedTo).toBe('/inspections')
    expect(cookieJar.get('fo_at')).toMatchObject({
      value: 'access-token',
      options: { httpOnly: true, sameSite: 'lax', maxAge: 900 },
    })
    expect(cookieJar.get('fo_rt')?.value).toBe('refresh-token')

    const [url, init] = fetchMock.mock.calls[0] ?? []
    expect(url).toBe('http://api.test/api/v1/auth/login')
    expect(JSON.parse(String(init?.body))).toEqual(credentials)
  })

  it('ignora destino externo e leva ao painel inicial', async () => {
    fetchMock.mockResolvedValueOnce(loginSuccess('ADMIN'))

    const result = await submit({ ...credentials, redirect: 'https://golpe.com' })

    expect(result.redirectedTo).toBe('/dashboard')
  })

  it('valida o formulario no servidor antes de chamar a API', async () => {
    const result = await submit({ email: 'nao-e-email', password: '' })

    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.state?.fieldErrors).toEqual({
      email: 'Informe um e-mail válido.',
      password: 'Informe a senha.',
    })
  })

  it('mostra a mesma mensagem para credencial invalida e mantem o e-mail digitado', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(401, { status: 401, code: 'AUTH_INVALID_CREDENTIALS', message: 'Invalid' }),
    )

    const result = await submit(credentials)

    expect(result.state).toMatchObject({
      message: AUTH_MESSAGES.invalidCredentials,
      email: credentials.email,
    })
    expect(cookieJar.size).toBe(0)
  })

  it('orienta a procurar a administracao quando a conta esta inativa', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(401, { status: 401, code: 'AUTH_USER_INACTIVE', message: 'Inactive' }),
    )

    const result = await submit(credentials)

    expect(result.state?.message).toBe(AUTH_MESSAGES.inactiveUser)
  })

  it('avisa quando a API nao responde', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'))

    const result = await submit(credentials)

    expect(result.state?.message).toBe(AUTH_MESSAGES.unavailable)
  })

  it('recusa o perfil Tecnico e revoga o token emitido', async () => {
    fetchMock
      .mockResolvedValueOnce(loginSuccess('TECHNICIAN'))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    const result = await submit(credentials)

    expect(result.state?.message).toBe(AUTH_MESSAGES.technicianNotAllowed)
    expect(cookieJar.size).toBe(0)

    const [url, init] = fetchMock.mock.calls[1] ?? []
    expect(url).toBe('http://api.test/api/v1/auth/logout')
    expect(JSON.parse(String(init?.body))).toEqual({ refreshToken: 'refresh-token' })
  })
})
