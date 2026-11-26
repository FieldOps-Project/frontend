import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { loadActiveUsers, loadClients } from '@/features/catalog/lookups'
import { API, mockApi, server } from '@/test/api'
import { withSession } from '@/test/next'

vi.mock('server-only', () => ({}))
vi.mock('next/headers', async () => (await import('@/test/next')).nextHeaders)
vi.mock('next/navigation', async () => (await import('@/test/next')).nextNavigation)

mockApi()

beforeEach(() => withSession())

function pagedApi(total: number) {
  const requested: string[] = []
  const handler = (path: string) =>
    http.get(`${API}${path}`, ({ request }) => {
      const url = new URL(request.url)
      requested.push(url.search)
      const page = Number(url.searchParams.get('page'))
      const size = Number(url.searchParams.get('size'))
      const from = page * size
      const content = Array.from({ length: Math.max(Math.min(size, total - from), 0) }, (_, index) => ({
        id: `item-${from + index}`,
      }))
      return HttpResponse.json({
        content,
        page,
        size,
        totalElements: total,
        totalPages: Math.ceil(total / size),
        first: page === 0,
        last: from + size >= total,
      })
    })
  return { requested, handler }
}

describe('lookups de cadastro', () => {
  it('percorre todas as paginas para o seletor nao truncar em 100 registros', async () => {
    const api = pagedApi(250)
    server.use(api.handler('/clients'))

    const clients = await loadClients()

    expect(clients).toHaveLength(250)
    expect(clients[249]).toEqual({ id: 'item-249' })
    expect(api.requested).toHaveLength(3)
  })

  it('uma pagina so faz uma chamada', async () => {
    const api = pagedApi(40)
    server.use(api.handler('/clients'))

    expect(await loadClients()).toHaveLength(40)
    expect(api.requested).toHaveLength(1)
  })

  it('para no teto de dez paginas', async () => {
    const api = pagedApi(5000)
    server.use(api.handler('/clients'))

    expect(await loadClients()).toHaveLength(1000)
    expect(api.requested).toHaveLength(10)
  })

  it('envia os filtros de situacao e perfil em todas as paginas', async () => {
    const api = pagedApi(150)
    server.use(api.handler('/users'))

    await loadActiveUsers('TECHNICIAN')

    expect(api.requested).toHaveLength(2)
    for (const search of api.requested) {
      expect(search).toContain('role=TECHNICIAN')
      expect(search).toContain('status=ACTIVE')
    }
  })
})
