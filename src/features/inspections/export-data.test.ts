import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchInspectionsCsv } from '@/features/inspections/export-data'
import { ApiError } from '@/lib/api/errors'

vi.mock('server-only', () => ({}))

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubEnv('API_BASE_URL', 'http://api.test/api/v1')
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('fetchInspectionsCsv', () => {
  it('pede o CSV com os mesmos filtros e a ordem da listagem', async () => {
    fetchMock.mockResolvedValue(new Response('id\r\n'))

    await fetchInspectionsCsv('token', { search: 'gerador', overdue: true, date: '2026-11-23' })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const parsed = new URL(url)
    expect(parsed.pathname).toBe('/api/v1/inspections/export.csv')
    expect(Object.fromEntries(parsed.searchParams)).toEqual({
      search: 'gerador',
      overdue: 'true',
      scheduledFrom: '2026-11-23T00:00:00-03:00',
      scheduledTo: '2026-11-23T23:59:59.999-03:00',
      sort: 'scheduledFor,asc',
    })
    expect(init.headers).toMatchObject({ Accept: 'text/csv', Authorization: 'Bearer token' })
  })

  it('transforma a recusa da API em ApiError', async () => {
    fetchMock.mockResolvedValue(Response.json({ status: 403, code: 'FORBIDDEN', message: 'Sem acesso' }, { status: 403 }))

    await expect(fetchInspectionsCsv('token', {})).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' })
  })

  it('transforma API fora do ar em ApiError de rede', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))

    await expect(fetchInspectionsCsv('token', {})).rejects.toBeInstanceOf(ApiError)
  })
})
