import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { loadInspectionEvidences } from '@/features/evidence/evidence-data'

vi.mock('server-only', () => ({}))

const load = vi.fn()
const verifySession = vi.fn()

vi.mock('@/lib/dal', () => ({
  load: (path: string, query?: unknown) => load(path, query),
  verifySession: () => verifySession(),
}))

const EVIDENCE = {
  id: 'e1',
  inspectionId: 'insp-1',
  responseId: null,
  nonConformityId: 'nc-1',
  description: 'Etiqueta',
  capturedAtDevice: '2026-11-16T12:16:00Z',
  latitude: null,
  longitude: null,
  uploadedAt: '2026-11-16T13:00:00Z',
  serverReceivedAt: '2026-11-16T13:00:00Z',
}

beforeEach(() => {
  verifySession.mockResolvedValue({ id: 'u1', role: 'SUPERVISOR' })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('loadInspectionEvidences', () => {
  it('le /inspections/{id}/evidence e poe em cada foto o titulo da nao conformidade', async () => {
    load.mockImplementation(async (path: string) => {
      if (path === '/inspections/insp-1/evidence') return [EVIDENCE, { ...EVIDENCE, id: 'e2', nonConformityId: null }]
      return { content: [{ id: 'nc-1', title: 'Etiqueta danificada' }] }
    })

    const evidences = await loadInspectionEvidences('insp-1')

    expect(evidences?.map((evidence) => [evidence.id, evidence.nonConformityTitle])).toEqual([
      ['e1', 'Etiqueta danificada'],
      ['e2', null],
    ])
  })

  it.each(['ADMIN', 'TECHNICIAN'])('nao consulta a API para o perfil %s, que ela recusaria', async (role) => {
    verifySession.mockResolvedValue({ id: 'u2', role })

    expect(await loadInspectionEvidences('insp-1')).toBeNull()
    expect(load).not.toHaveBeenCalled()
  })
})
