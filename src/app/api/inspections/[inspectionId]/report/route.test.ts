import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { GET } from '@/app/api/inspections/[inspectionId]/report/route'
import { ApiError } from '@/lib/api/errors'

vi.mock('server-only', () => ({}))

const requireRole = vi.fn()
const getAccessToken = vi.fn()
const apiFetchFile = vi.fn()

vi.mock('@/lib/dal', () => ({ requireRole: (roles: readonly string[]) => requireRole(roles) }))
vi.mock('@/lib/session', () => ({ getAccessToken: () => getAccessToken() }))
vi.mock('@/lib/api/client', () => ({
  apiFetchFile: (path: string, request: unknown) => apiFetchFile(path, request),
}))

const ID = 'd0000000-0000-4000-8000-000000000503'

function call(id: string) {
  return GET(new Request(`http://localhost/api/inspections/${id}/report`), { params: Promise.resolve({ inspectionId: id }) })
}

function pdf(headers: Record<string, string> = { 'Content-Type': 'application/pdf' }) {
  return new Response('%PDF-1.7', { headers })
}

beforeEach(() => {
  requireRole.mockResolvedValue({ role: 'SUPERVISOR' })
  getAccessToken.mockResolvedValue('token')
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/inspections/[id]/report', () => {
  it('revalida o perfil e repassa o PDF da API como anexo', async () => {
    apiFetchFile.mockResolvedValue(pdf())

    const response = await call(ID)

    expect(requireRole).toHaveBeenCalledWith(['ADMIN', 'SUPERVISOR'])
    expect(apiFetchFile).toHaveBeenCalledWith(`/inspections/${ID}/report.pdf`, { token: 'token', accept: 'application/pdf' })
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/pdf')
    expect(response.headers.get('Content-Disposition')).toBe('attachment; filename="relatorio-INS-D0000000.pdf"')
    expect(await response.text()).toBe('%PDF-1.7')
  })

  it('aceita o tipo com parametros e nao entrega outro tipo de arquivo', async () => {
    apiFetchFile.mockResolvedValue(pdf({ 'Content-Type': 'application/pdf; charset=binary' }))
    expect((await call(ID)).status).toBe(200)

    apiFetchFile.mockResolvedValue(pdf({ 'Content-Type': 'text/html' }))
    expect((await call(ID)).status).toBe(502)
  })

  it('nao chama a API sem token nem com identificador invalido', async () => {
    getAccessToken.mockResolvedValue(null)
    expect((await call(ID)).status).toBe(401)

    getAccessToken.mockResolvedValue('token')
    expect((await call('../users')).status).toBe(404)
    expect(apiFetchFile).not.toHaveBeenCalled()
  })

  it('repassa a recusa e a ausencia da inspecao', async () => {
    apiFetchFile.mockRejectedValue(new ApiError({ status: 403, code: 'AUTH_FORBIDDEN', message: '' }))
    expect((await call(ID)).status).toBe(403)

    apiFetchFile.mockRejectedValue(new ApiError({ status: 404, code: 'INSPECTION_NOT_FOUND', message: '' }))
    expect((await call(ID)).status).toBe(404)
  })

  it('responde 502 quando a API falha de outro jeito', async () => {
    apiFetchFile.mockRejectedValue(new ApiError({ status: 500, code: 'INTERNAL_ERROR', message: '' }))
    expect((await call(ID)).status).toBe(502)
  })
})
