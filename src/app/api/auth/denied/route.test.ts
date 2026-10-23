import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { GET } from '@/app/api/auth/denied/route'

vi.mock('server-only', () => ({}))

const cookieJar = new Map<string, { value: string }>()

vi.mock('next/headers', () => ({
  cookies: async () => ({
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

const fetchMock = vi.fn<typeof fetch>()

function me(role: string) {
  return new Response(JSON.stringify({ id: 'user-id', name: 'Carlos', email: 'carlos@fieldops.local', role }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function call() {
  try {
    await GET()
  } catch (error) {
    if (error instanceof RedirectSignal) return error.target
    throw error
  }
  throw new Error('a rota sempre redireciona')
}

beforeEach(() => {
  vi.stubEnv('API_BASE_URL', 'http://api.test/api/v1')
  vi.stubGlobal('fetch', fetchMock)
  cookieJar.set('fo_at', { value: 'access-token' })
  cookieJar.set('fo_rt', { value: 'refresh-token' })
})

afterEach(() => {
  cookieJar.clear()
  fetchMock.mockReset()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('GET /api/auth/denied', () => {
  it('encerra a sessao de quem nao usa o painel e leva ao login com o aviso', async () => {
    fetchMock.mockResolvedValueOnce(me('TECHNICIAN')).mockResolvedValueOnce(new Response(null, { status: 204 }))

    expect(await call()).toBe('/login?denied=1')

    const [url, init] = fetchMock.mock.calls[1] ?? []
    expect(String(url)).toBe('http://api.test/api/v1/auth/logout')
    expect(JSON.parse(String(init?.body))).toEqual({ refreshToken: 'refresh-token' })
    expect(cookieJar.size).toBe(0)
  })

  it('nao derruba a sessao de administrador ou supervisor', async () => {
    fetchMock.mockResolvedValueOnce(me('SUPERVISOR'))

    expect(await call()).toBe('/dashboard')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(cookieJar.has('fo_rt')).toBe(true)
  })

  it('limpa a sessao mesmo com a API fora do ar', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))

    expect(await call()).toBe('/login?denied=1')
    expect(cookieJar.size).toBe(0)
  })
})
