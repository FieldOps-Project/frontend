import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { signOut } from '@/features/auth/actions'

vi.mock('server-only', () => ({}))

const cookieJar = new Map<string, { value: string }>()

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => cookieJar.get(name),
    delete: (name: string) => cookieJar.delete(name),
  }),
}))

vi.mock('next/navigation', () => ({
  redirect: (target: string) => {
    throw new Error(`redirect:${target}`)
  },
}))

const fetchMock = vi.fn<typeof fetch>()

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

describe('signOut', () => {
  it('revoga o refresh token na API antes de apagar a sessao local', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))

    await expect(signOut()).rejects.toThrow('redirect:/login')

    const [url, init] = fetchMock.mock.calls[0] ?? []
    expect(url).toBe('http://api.test/api/v1/auth/logout')
    expect(JSON.parse(String(init?.body))).toEqual({ refreshToken: 'refresh-token' })
    expect(cookieJar.size).toBe(0)
  })

  it('encerra a sessao local mesmo quando a API nao responde', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'))

    await expect(signOut()).rejects.toThrow('redirect:/login')

    expect(cookieJar.size).toBe(0)
  })
})
