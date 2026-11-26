import { afterEach, describe, expect, it, vi } from 'vitest'

import { cancelInspection } from '@/features/inspections/detail-actions'
import { CANCEL_REASON_MAX_LENGTH } from '@/lib/domain/inspection-detail'

vi.mock('server-only', () => ({}))

const revalidatePath = vi.fn()
vi.mock('next/cache', () => ({ revalidatePath: (path: string) => revalidatePath(path) }))

const send = vi.fn()

vi.mock('@/lib/dal', () => ({
  requireRole: async () => ({ id: 'u1', name: 'Mariana Costa', email: 'm@fieldops.dev', role: 'SUPERVISOR' }),
  send: (path: string, request: unknown) => send(path, request),
  actionError: (error: Error) => ({ ok: false, message: error.message }),
}))

const ID = '3d8dc050-54f4-4d3b-9e5d-5fdb29ae3ed5'

afterEach(() => {
  send.mockReset()
  revalidatePath.mockReset()
})

describe('cancelInspection', () => {
  it('exige justificativa (RN-029)', async () => {
    const result = await cancelInspection(ID, '   ')

    expect(result).toEqual({ ok: false, message: 'Informe o motivo do cancelamento.' })
    expect(send).not.toHaveBeenCalled()
  })

  it('recusa justificativa maior que o limite da API', async () => {
    const result = await cancelInspection(ID, 'a'.repeat(CANCEL_REASON_MAX_LENGTH + 1))

    expect(result.ok).toBe(false)
    expect(send).not.toHaveBeenCalled()
  })

  it('envia o motivo no contrato da API e atualiza as telas que mostram a inspecao', async () => {
    send.mockResolvedValue({ id: ID, status: 'CANCELED' })

    const result = await cancelInspection(ID, '  Cliente pediu reagendamento.  ')

    expect(result).toEqual({ ok: true, message: 'Inspeção cancelada.' })
    expect(send).toHaveBeenCalledWith(`/inspections/${ID}/cancel`, {
      method: 'POST',
      body: { reason: 'Cliente pediu reagendamento.' },
    })
    expect(revalidatePath).toHaveBeenCalledWith(`/inspections/${ID}`)
    expect(revalidatePath).toHaveBeenCalledWith('/inspections')
  })

  it('devolve a mensagem da API quando ela recusa a transicao (RN-089)', async () => {
    send.mockRejectedValue(new Error('Esta ação não é possível no estado atual da inspeção.'))

    const result = await cancelInspection(ID, 'Motivo')

    expect(result).toEqual({ ok: false, message: 'Esta ação não é possível no estado atual da inspeção.' })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('recusa identificador que nao e UUID antes de chamar a API', async () => {
    await expect(cancelInspection('../users', 'Motivo')).rejects.toThrow('Identificador invalido.')
    expect(send).not.toHaveBeenCalled()
  })
})
