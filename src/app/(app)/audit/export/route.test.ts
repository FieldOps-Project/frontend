import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { GET } from '@/app/(app)/audit/export/route'

vi.mock('server-only', () => ({}))

const requireRole = vi.fn()

vi.mock('@/lib/dal', () => ({
  requireRole: (roles: readonly string[]) => requireRole(roles),
  load: vi.fn(),
  loadOptional: vi.fn(async () => null),
}))
vi.mock('@/features/catalog/lookups', () => ({ loadActiveUsers: async () => [], loadClients: async () => [] }))

beforeEach(() => {
  requireRole.mockResolvedValue({ role: 'SUPERVISOR' })
  vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'development')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('GET /audit/export', () => {
  it('revalida o perfil e baixa o CSV com os filtros da URL', async () => {
    const response = await GET(new NextRequest('http://localhost/audit/export?period=all&action=INSPECTION_CANCELED'))
    const csv = await response.text()

    expect(requireRole).toHaveBeenCalledWith(['ADMIN', 'SUPERVISOR'])
    expect(response.headers.get('Content-Disposition')).toContain('auditoria-')
    expect(csv).toContain('ID do evento;Data/hora (servidor)')
    expect(csv).toContain('Inspeção cancelada')
    expect(csv).not.toContain('Supervisor aprovou')
  })

  it('responde indisponivel quando a API nao publica a auditoria', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'production')
    const response = await GET(new NextRequest('http://localhost/audit/export'))
    expect(response.status).toBe(503)
  })
})
