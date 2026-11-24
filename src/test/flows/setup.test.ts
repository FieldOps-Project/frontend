import { describe, expect, it, vi } from 'vitest'

import { load } from '@/lib/dal'
import { ok, mockApi } from '@/test/api'
import { withSession } from '@/test/next'

vi.mock('server-only', () => ({}))
vi.mock('next/headers', async () => (await import('@/test/next')).nextHeaders)
vi.mock('next/navigation', async () => (await import('@/test/next')).nextNavigation)

mockApi()

describe('API simulada na rede', () => {
  it('responde pelo fetch real, com o token da sessao no cabecalho', async () => {
    const { server } = await import('@/test/api')
    const { http, HttpResponse } = await import('msw')
    let authorization: string | null = null
    server.use(
      http.get('http://api.test/api/v1/clients', ({ request }) => {
        authorization = request.headers.get('Authorization')
        return HttpResponse.json({ content: [] })
      }),
    )
    withSession()

    expect(await load('/clients')).toEqual({ content: [] })
    expect(authorization).toBe('Bearer access-token')
  })

  it('aceita handlers prontos', async () => {
    const { server } = await import('@/test/api')
    server.use(ok('get', '/sites', { content: [{ id: 's1' }] }))
    withSession()

    expect(await load('/sites')).toEqual({ content: [{ id: 's1' }] })
  })
})
