import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { apiFetchFile } from '@/lib/api/client'

vi.mock('server-only', () => ({}))

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  process.env.API_BASE_URL = 'http://api.test/api/v1'
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockResolvedValue(new Response('file'))
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

function acceptSent(): string {
  const init = fetchMock.mock.calls[0]?.[1] as RequestInit
  return (init.headers as Record<string, string>).Accept as string
}

describe('apiFetchFile', () => {
  it('pede imagem por padrao, como na evidencia', async () => {
    await apiFetchFile('/evidence/1/file', { token: 'token' })

    expect(acceptSent()).toBe('image/*')
  })

  it('aceita outro tipo de arquivo quando informado', async () => {
    await apiFetchFile('/inspections/1/report', { token: 'token', accept: 'application/pdf' })

    expect(acceptSent()).toBe('application/pdf')
  })
})
