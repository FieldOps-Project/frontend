import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { cancelInspection } from '@/features/inspections/detail-actions'
import { loadInspectionDetail, loadInspectionHistory } from '@/features/inspections/detail-data'
import { resetDemoInspections } from '@/features/inspections/inspection-demo-store'

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('not found')
  },
}))
vi.mock('@/features/catalog/lookups', () => ({ loadActiveUsers: async () => [] }))

const send = vi.fn()

vi.mock('@/lib/dal', () => ({
  requireRole: async () => ({ id: 'u1', name: 'Mariana Costa', email: 'm@fieldops.dev', role: 'SUPERVISOR' }),
  send: (path: string, request: unknown) => send(path, request),
  actionError: (error: Error) => ({ ok: false, message: error.message }),
  load: vi.fn(),
  loadOptional: vi.fn(),
}))

const ASSIGNED_ID = 'c0000000-0000-4000-8000-000000000089'
const APPROVED_ID = 'c0000000-0000-4000-8000-000000000095'
const API_ID = '3d8dc050-54f4-4d3b-9e5d-5fdb29ae3ed5'

beforeEach(() => {
  resetDemoInspections()
  vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'development')
})

afterEach(() => {
  send.mockReset()
  vi.unstubAllEnvs()
})

describe('cancelInspection', () => {
  it('exige justificativa (RN-029)', async () => {
    const result = await cancelInspection(ASSIGNED_ID, '   ')
    expect(result).toEqual({ ok: false, message: 'Informe o motivo do cancelamento.' })
    expect(send).not.toHaveBeenCalled()
  })

  it('envia o motivo no contrato da API (backend #65)', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'production')
    send.mockResolvedValue({ id: API_ID, status: 'CANCELED' })

    const result = await cancelInspection(API_ID, '  Cliente pediu reagendamento.  ')

    expect(result.ok).toBe(true)
    expect(send).toHaveBeenCalledWith(`/inspections/${API_ID}/cancel`, {
      method: 'POST',
      body: { reason: 'Cliente pediu reagendamento.' },
    })
  })

  it('devolve a mensagem da API quando ela recusa a transicao (RN-089)', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'production')
    send.mockRejectedValue(new Error('A inspeção não pode ser cancelada no estado atual.'))

    const result = await cancelInspection(API_ID, 'Motivo')
    expect(result).toEqual({ ok: false, message: 'A inspeção não pode ser cancelada no estado atual.' })
  })

  it('na demonstracao, cancela e registra usuario, data e motivo no historico', async () => {
    const result = await cancelInspection(ASSIGNED_ID, 'Área interditada.')

    expect(result.ok).toBe(true)
    expect(send).not.toHaveBeenCalled()
    expect(await loadInspectionDetail(ASSIGNED_ID)).toMatchObject({
      status: 'CANCELED',
      canceledByName: 'Mariana Costa',
      canceledReason: 'Área interditada.',
    })
    expect((await loadInspectionHistory(ASSIGNED_ID))?.at(-1)).toMatchObject({
      action: 'INSPECTION_CANCELED',
      actorName: 'Mariana Costa',
      previousStatus: 'ASSIGNED',
      note: 'Área interditada.',
    })
  })

  it('na demonstracao, recusa cancelar inspecao aprovada (RN-030)', async () => {
    const result = await cancelInspection(APPROVED_ID, 'Motivo')
    expect(result.ok).toBe(false)
    expect((await loadInspectionDetail(APPROVED_ID)).status).toBe('APPROVED')
  })
})
