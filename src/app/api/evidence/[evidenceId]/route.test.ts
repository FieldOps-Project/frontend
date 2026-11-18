import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { GET } from '@/app/api/evidence/[evidenceId]/route'
import { demoReviewPhotoId } from '@/features/inspections/review-fixture'
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

const UPLOADED = demoReviewPhotoId(1)
const PENDING = demoReviewPhotoId(3)
const API_ID = '3d8dc050-54f4-4d3b-9e5d-5fdb29ae3ed5'

function call(id: string, variant?: string) {
  const url = `http://localhost/api/evidence/${id}${variant ? `?variant=${variant}` : ''}`
  return GET(new Request(url), { params: Promise.resolve({ evidenceId: id }) })
}

beforeEach(() => {
  getAccessToken.mockResolvedValue('token')
  apiFetch.mockResolvedValue({ id: 'u1', name: 'Mariana', email: 'm@x', role: 'SUPERVISOR' })
  vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'development')
})

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
})

describe('GET /api/evidence/[id]', () => {
  it('nao entrega imagem sem sessao valida', async () => {
    getAccessToken.mockResolvedValue(null)
    expect((await call(UPLOADED)).status).toBe(401)

    getAccessToken.mockResolvedValue('expirado')
    apiFetch.mockRejectedValue(new ApiError({ status: 401, code: 'UNAUTHORIZED', message: '' }))
    expect((await call(UPLOADED)).status).toBe(401)
  })

  it('nao entrega imagem a perfil fora do painel', async () => {
    apiFetch.mockResolvedValue({ id: 'u2', name: 'Técnico', email: 't@x', role: 'TECHNICIAN' })
    expect((await call(UPLOADED)).status).toBe(403)
  })

  it('recusa identificador que nao e UUID', async () => {
    expect((await call('../users')).status).toBe(404)
  })

  it('na demonstracao, desenha a miniatura e o original', async () => {
    const thumbnail = await call(UPLOADED)
    expect(thumbnail.headers.get('Content-Type')).toContain('image/svg+xml')
    expect(await thumbnail.text()).toContain('width="320"')

    expect(await (await call(UPLOADED, 'original')).text()).toContain('width="1600"')
  })

  it('responde 404 para o arquivo que ainda nao chegou', async () => {
    expect((await call(PENDING)).status).toBe(404)
  })

  it('fora da demonstracao, repassa o binario da API com o token', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'production')
    apiFetchFile.mockResolvedValue(new Response('jpeg', { headers: { 'Content-Type': 'image/jpeg' } }))

    const response = await call(API_ID, 'original')
    expect(apiFetchFile).toHaveBeenCalledWith(`/evidence/${API_ID}/file`, { token: 'token', query: { variant: 'original' } })
    expect(response.headers.get('Content-Type')).toBe('image/jpeg')
    expect(response.headers.get('Cache-Control')).toContain('private')
  })

  it('repassa o 403 da API para quem esta fora do escopo da inspecao', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'production')
    apiFetchFile.mockRejectedValue(new ApiError({ status: 403, code: 'FORBIDDEN', message: '' }))
    expect((await call(API_ID)).status).toBe(403)
  })
})
