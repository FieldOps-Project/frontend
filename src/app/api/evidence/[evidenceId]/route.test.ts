import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { GET } from '@/app/api/evidence/[evidenceId]/route'
import { ApiError } from '@/lib/api/errors'

vi.mock('server-only', () => ({}))

const getAccessToken = vi.fn()
const apiFetch = vi.fn()
const apiFetchFile = vi.fn()

vi.mock('@/lib/session', () => ({ getAccessToken: () => getAccessToken() }))
vi.mock('@/lib/api/client', () => ({
  apiFetch: (path: string, request: unknown) => apiFetch(path, request),
  apiFetchFile: (path: string, request: unknown) => apiFetchFile(path, request),
}))

const ID = '3d8dc050-54f4-4d3b-9e5d-5fdb29ae3ed5'

function call(id: string) {
  return GET(new Request(`http://localhost/api/evidence/${id}`), { params: Promise.resolve({ evidenceId: id }) })
}

beforeEach(() => {
  getAccessToken.mockResolvedValue('token')
  apiFetch.mockResolvedValue({ id: 'u1', name: 'Mariana', email: 'm@x', role: 'SUPERVISOR' })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/evidence/[id]', () => {
  it('nao entrega imagem sem sessao valida', async () => {
    getAccessToken.mockResolvedValue(null)
    expect((await call(ID)).status).toBe(401)

    getAccessToken.mockResolvedValue('expirado')
    apiFetch.mockRejectedValue(new ApiError({ status: 401, code: 'UNAUTHORIZED', message: '' }))
    expect((await call(ID)).status).toBe(401)
  })

  it.each(['ADMIN', 'TECHNICIAN'])('nao entrega imagem ao perfil %s, que a API tambem recusa', async (role) => {
    apiFetch.mockResolvedValue({ id: 'u2', name: 'Fulano', email: 'f@x', role })

    expect((await call(ID)).status).toBe(403)
    expect(apiFetchFile).not.toHaveBeenCalled()
  })

  it('recusa identificador que nao e UUID', async () => {
    expect((await call('../users')).status).toBe(404)
    expect(apiFetchFile).not.toHaveBeenCalled()
  })

  it('repassa o binario de GET /evidence/{id} com o token, sem variante', async () => {
    apiFetchFile.mockResolvedValue(new Response('jpeg', { headers: { 'Content-Type': 'image/jpeg' } }))

    const response = await call(ID)

    expect(apiFetchFile).toHaveBeenCalledWith(`/evidence/${ID}`, { token: 'token' })
    expect(await response.text()).toBe('jpeg')
    expect(response.headers.get('Content-Type')).toBe('image/jpeg')
    expect(response.headers.get('Cache-Control')).toBe('private, no-cache')
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
  })

  it('nao repassa arquivo que nao e foto comum, como SVG com script', async () => {
    apiFetchFile.mockResolvedValue(new Response('<svg onload="alert(1)"/>', { headers: { 'Content-Type': 'image/svg+xml' } }))
    expect((await call(ID)).status).toBe(502)
  })

  it('repassa o 404 do arquivo apagado ou ainda nao enviado', async () => {
    apiFetchFile.mockRejectedValue(new ApiError({ status: 404, code: 'NOT_FOUND', message: '' }))
    expect((await call(ID)).status).toBe(404)
  })

  it('repassa o 403 da API para quem esta fora do escopo da inspecao', async () => {
    apiFetchFile.mockRejectedValue(new ApiError({ status: 403, code: 'FORBIDDEN', message: '' }))
    expect((await call(ID)).status).toBe(403)
  })

  it('devolve 502 quando a API falha', async () => {
    apiFetchFile.mockRejectedValue(new ApiError({ status: 500, code: 'INTERNAL', message: '' }))
    expect((await call(ID)).status).toBe(502)
  })
})
