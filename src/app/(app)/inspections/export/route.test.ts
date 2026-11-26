import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { GET } from '@/app/(app)/inspections/export/route'
import { ApiError } from '@/lib/api/errors'

vi.mock('server-only', () => ({}))

const requireRole = vi.fn()
const fetchInspectionsCsv = vi.fn()

vi.mock('@/lib/dal', () => ({ requireRole: (roles: readonly string[]) => requireRole(roles) }))
vi.mock('@/lib/session', () => ({ getAccessToken: async () => 'token' }))
vi.mock('@/features/inspections/export-data', () => ({
  fetchInspectionsCsv: (token: string, filters: unknown) => fetchInspectionsCsv(token, filters),
}))

beforeEach(() => {
  requireRole.mockResolvedValue({ role: 'SUPERVISOR' })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('GET /inspections/export', () => {
  it('revalida o perfil e repassa o CSV da API com os filtros da URL', async () => {
    fetchInspectionsCsv.mockResolvedValue(new Response('id;title\r\n'))

    const response = await GET(new NextRequest('http://localhost/inspections/export?search=gerador&overdue=1&review=1'))

    expect(requireRole).toHaveBeenCalledWith(['ADMIN', 'SUPERVISOR'])
    expect(fetchInspectionsCsv).toHaveBeenCalledWith(
      'token',
      expect.objectContaining({ search: 'gerador', overdue: true }),
    )
    expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8')
    expect(response.headers.get('Content-Disposition')).toContain('inspecoes-')
    expect(await response.text()).toBe('id;title\r\n')
  })

  it('repassa a recusa de acesso da API', async () => {
    fetchInspectionsCsv.mockRejectedValue(new ApiError({ status: 403, code: 'FORBIDDEN', message: '' }))

    expect((await GET(new NextRequest('http://localhost/inspections/export'))).status).toBe(403)
  })

  it('responde 502 quando a API falha de outro jeito', async () => {
    fetchInspectionsCsv.mockRejectedValue(new ApiError({ status: 500, code: 'INTERNAL_ERROR', message: '' }))

    expect((await GET(new NextRequest('http://localhost/inspections/export'))).status).toBe(502)
  })
})
