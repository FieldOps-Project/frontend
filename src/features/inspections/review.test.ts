import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { rejectInspection } from '@/features/inspections/review-actions'
import { canDecide } from '@/features/inspections/review-data'
import { DEMO_REVIEW } from '@/features/inspections/review-fixture'
import { executionDuration, isAnswered, reviewItems } from '@/lib/domain/inspection-review'

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const requireRole = vi.fn()
const send = vi.fn()

vi.mock('@/lib/dal', () => ({
  requireRole: (roles: readonly string[]) => requireRole(roles),
  send: (path: string, request: unknown) => send(path, request),
  actionError: (error: Error) => ({ ok: false, message: error.message }),
}))

const INSPECTION_ID = '3d8dc050-54f4-4d3b-9e5d-5fdb29ae3ed5'
const ITEM_ID = 'ab18a638-1c45-4a15-a444-b4235506e912'

beforeEach(() => {
  requireRole.mockResolvedValue({ role: 'SUPERVISOR' })
})

afterEach(() => {
  requireRole.mockReset()
  send.mockReset()
  vi.unstubAllEnvs()
})

describe('canDecide', () => {
  it('deixa so o supervisor decidir, e so com a inspecao em revisao (RN-079)', () => {
    expect(canDecide('SUPERVISOR', DEMO_REVIEW)).toBe(true)
    expect(canDecide('ADMIN', DEMO_REVIEW)).toBe(false)
    expect(canDecide('SUPERVISOR', { ...DEMO_REVIEW, status: 'APPROVED' })).toBe(false)
  })
})

describe('rejectInspection', () => {
  it('exige o perfil de supervisor', async () => {
    send.mockResolvedValue(undefined)

    await rejectInspection(INSPECTION_ID, 'Foto ilegível', [])

    expect(requireRole).toHaveBeenCalledWith(['SUPERVISOR'])
  })

  it('bloqueia a reprovacao sem motivo, sem chamar a API (RN-080)', async () => {
    const result = await rejectInspection(INSPECTION_ID, '   ', [])

    expect(result).toEqual({ ok: false, message: 'Informe o motivo da reprovação.' })
    expect(send).not.toHaveBeenCalled()
  })

  it('envia motivo e itens a corrigir no contrato do documento 12', async () => {
    send.mockResolvedValue(undefined)

    const result = await rejectInspection(INSPECTION_ID, '  A foto do item 4 está ilegível. ', [ITEM_ID])

    expect(result.ok).toBe(true)
    expect(send).toHaveBeenCalledWith(`/inspections/${INSPECTION_ID}/reject`, {
      method: 'POST',
      body: { reason: 'A foto do item 4 está ilegível.', itemsToCorrect: [ITEM_ID] },
    })
  })

  it('recusa identificador de item que nao e UUID', async () => {
    await expect(rejectInspection(INSPECTION_ID, 'Motivo', ['../users'])).rejects.toThrow()
    expect(send).not.toHaveBeenCalled()
  })

  it('nao envia nada na demonstracao', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'development')

    const result = await rejectInspection(DEMO_REVIEW.id, 'Motivo', [])

    expect(result.ok).toBe(false)
    expect(send).not.toHaveBeenCalled()
  })
})

describe('resumo da inspecao', () => {
  it('conta os 42 itens respondidos da demonstracao', () => {
    const items = reviewItems(DEMO_REVIEW)

    expect(items).toHaveLength(42)
    expect(items.every(isAnswered)).toBe(true)
  })

  it('calcula a duracao pelo relogio do dispositivo', () => {
    expect(executionDuration(DEMO_REVIEW)).toBe('2h 45m')
    expect(executionDuration({ ...DEMO_REVIEW, completedAtDevice: null })).toBeNull()
  })
})

describe('demonstracao', () => {
  it('usa UUID em todos os itens e liga cada nao conformidade a um item existente', () => {
    const ids = new Set(reviewItems(DEMO_REVIEW).map((item) => item.id))
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    expect([...ids].every((id) => uuid.test(id))).toBe(true)
    expect(DEMO_REVIEW.nonConformities.every((nc) => nc.itemId && ids.has(nc.itemId))).toBe(true)
  })
})
