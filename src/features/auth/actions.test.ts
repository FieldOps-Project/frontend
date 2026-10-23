import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { signIn, signOut } from '@/features/auth/actions'

vi.mock('server-only', () => ({}))

const cookieJar = new Map<string, { value: string; options: Record<string, unknown> }>()

vi.mock('next/headers', () => ({
  cookies: async () => ({
    set: (name: string, value: string, options: Record<string, unknown>) => cookieJar.set(name, { value, options }),
    get: (name: string) => cookieJar.get(name),
    has: (name: string) => cookieJar.has(name),
    delete: (name: string) => cookieJar.delete(name),
  }),
  headers: async () => new Headers(),
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
 * duplo: assim o codigo real de acesso a API continua sob teste.
 */
const fetchMock = vi.fn<typeof fetch>()

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function apiError(status: number, code: string, fieldErrors: { field: string; message: string }[] = []) {
  return jsonResponse(status, { status, code, message: 'english message', fieldErrors })
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

async function run<T>(action: () => Promise<T>) {
  try {
    return { state: await action() }
  } catch (error) {
    if (error instanceof RedirectSignal) return { redirectedTo: error.target }
    throw error
  }
}

const submit = (values: Record<string, string>) => run(() => signIn({}, form(values)))

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
    expect(cookieJar.get('fo_at')).toMatchObject({ value: 'access-token', options: { httpOnly: true, sameSite: 'lax' } })
    expect(cookieJar.get('fo_rt')).toMatchObject({ value: 'refresh-token', options: { httpOnly: true } })

    const [url, init] = fetchMock.mock.calls[0] ?? []
    expect(String(url)).toBe('http://api.test/api/v1/auth/login')
    expect(JSON.parse(String(init?.body))).toEqual(credentials)
  })

  it('ignora destino externo e cai no dashboard', async () => {
    fetchMock.mockResolvedValueOnce(loginSuccess('ADMIN'))

    expect((await submit({ ...credentials, redirect: 'https://golpe.example' })).redirectedTo).toBe('/dashboard')
  })

  it('valida no servidor antes de chamar a API', async () => {
    const result = await submit({ email: 'nao-e-email', password: '' })

    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.state).toEqual({
      fieldErrors: { email: 'Informe um e-mail válido.', password: 'Informe a senha.' },
      email: 'nao-e-email',
    })
  })

  it('mostra a mesma mensagem para credencial invalida e preserva o e-mail', async () => {
    fetchMock.mockResolvedValueOnce(apiError(401, 'AUTH_INVALID_CREDENTIALS'))

    const result = await submit(credentials)

    expect(result.state).toMatchObject({ error: 'E-mail ou senha incorretos.', email: credentials.email })
    expect(cookieJar.size).toBe(0)
  })

  it('orienta a conta inativa', async () => {
    fetchMock.mockResolvedValueOnce(apiError(401, 'AUTH_USER_INACTIVE'))

    expect((await submit(credentials)).state?.error).toBe(
      'Sua conta está inativa ou bloqueada. Procure a administração do sistema.',
    )
  })

  it('leva os erros de campo da API para o campo certo, traduzidos', async () => {
    fetchMock.mockResolvedValueOnce(
      apiError(400, 'VALIDATION_ERROR', [{ field: 'email', message: 'must be a well-formed email address' }]),
    )

    expect((await submit(credentials)).state?.fieldErrors).toEqual({
      email: 'Informe um e-mail válido.',
      password: undefined,
    })
  })

  it('avisa quando a API esta fora do ar', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'))

    expect((await submit(credentials)).state?.error).toBe(
      'Não foi possível falar com a API. Verifique se ela está no ar e tente de novo.',
    )
  })
})

describe('signOut', () => {
  it('revoga o refresh token na API antes de apagar os cookies', async () => {
    cookieJar.set('fo_at', { value: 'access-token', options: {} })
    cookieJar.set('fo_rt', { value: 'refresh-token', options: {} })
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))

    const result = await run(signOut)

    expect(result.redirectedTo).toBe('/login')
    const [url, init] = fetchMock.mock.calls[0] ?? []
    expect(String(url)).toBe('http://api.test/api/v1/auth/logout')
    expect(JSON.parse(String(init?.body))).toEqual({ refreshToken: 'refresh-token' })
    expect(cookieJar.size).toBe(0)
  })

  it('sai localmente mesmo com a API fora do ar', async () => {
    cookieJar.set('fo_rt', { value: 'refresh-token', options: {} })
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'))

    expect((await run(signOut)).redirectedTo).toBe('/login')
    expect(cookieJar.size).toBe(0)
  })
})
