import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { approveInspection, beginReview, rejectInspection } from '@/features/inspections/review-actions'
import { loadInspectionReview } from '@/features/inspections/review-data'
import { REVIEW_TEXT_MAX_LENGTH } from '@/lib/domain/inspection-review'

vi.mock('server-only', () => ({}))

const revalidatePath = vi.fn()
vi.mock('next/cache', () => ({ revalidatePath: (path: string) => revalidatePath(path) }))

const requireRole = vi.fn()
const send = vi.fn()
const load = vi.fn()
const loadIfPermitted = vi.fn()

vi.mock('@/lib/dal', () => ({
  requireRole: (roles: readonly string[]) => requireRole(roles),
  send: (path: string, request: unknown) => send(path, request),
  load: (path: string) => load(path),
  loadIfPermitted: (path: string) => loadIfPermitted(path),
  actionError: (error: Error) => ({ ok: false, message: error.message }),
}))

const loadInspectionDetail = vi.fn()
vi.mock('@/features/inspections/detail-data', () => ({ loadInspectionDetail: (id: string) => loadInspectionDetail(id) }))

const loadInspectionNonConformities = vi.fn()
vi.mock('@/features/non-conformities/non-conformities-data', () => ({
  loadInspectionNonConformities: (id: string) => loadInspectionNonConformities(id),
}))

const loadInspectionEvidences = vi.fn()
vi.mock('@/features/evidence/evidence-data', () => ({
  loadInspectionEvidences: (id: string) => loadInspectionEvidences(id),
}))

const INSPECTION_ID = '3d8dc050-54f4-4d3b-9e5d-5fdb29ae3ed5'
const ITEM_ID = 'ab18a638-1c45-4a15-a444-b4235506e912'
const SUPERVISOR_ID = 'd0000000-0000-4000-8000-000000000002'

beforeEach(() => {
  requireRole.mockResolvedValue({ role: 'SUPERVISOR' })
  send.mockResolvedValue(undefined)
})

afterEach(() => {
  requireRole.mockReset()
  send.mockReset()
  revalidatePath.mockReset()
  load.mockReset()
  loadIfPermitted.mockReset()
  loadInspectionDetail.mockReset()
  loadInspectionNonConformities.mockReset()
  loadInspectionEvidences.mockReset()
})

describe('beginReview', () => {
  it('exige o perfil de supervisor e chama begin-review sem corpo', async () => {
    const result = await beginReview(INSPECTION_ID)

    expect(requireRole).toHaveBeenCalledWith(['SUPERVISOR'])
    expect(send).toHaveBeenCalledWith(`/inspections/${INSPECTION_ID}/begin-review`, { method: 'POST', body: undefined })
    expect(result).toEqual({ ok: true, message: 'Revisão iniciada.' })
  })

  it('revalida revisao, detalhe, lista, fila e painel', async () => {
    await beginReview(INSPECTION_ID)

    expect(revalidatePath.mock.calls.map(([path]) => path)).toEqual([
      `/inspections/${INSPECTION_ID}/review`,
      `/inspections/${INSPECTION_ID}`,
      '/inspections',
      '/inspections/review-queue',
      '/dashboard',
    ])
  })

  it('devolve a mensagem de erro quando a transicao e recusada e nao revalida', async () => {
    send.mockRejectedValue(new Error('Esta ação não é possível no estado atual da inspeção.'))

    await expect(beginReview(INSPECTION_ID)).resolves.toEqual({
      ok: false,
      message: 'Esta ação não é possível no estado atual da inspeção.',
    })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('recusa identificador que nao e UUID', async () => {
    await expect(beginReview('../users')).rejects.toThrow()
    expect(send).not.toHaveBeenCalled()
  })
})

describe('approveInspection', () => {
  it('aprova com o comentario aparado', async () => {
    const result = await approveInspection(INSPECTION_ID, '  Tudo certo.  ')

    expect(requireRole).toHaveBeenCalledWith(['SUPERVISOR'])
    expect(result).toEqual({ ok: true, message: 'Inspeção aprovada.' })
    expect(send).toHaveBeenCalledWith(`/inspections/${INSPECTION_ID}/approve`, {
      method: 'POST',
      body: { comments: 'Tudo certo.' },
    })
  })

  it('trata comentario em branco como ausente', async () => {
    await approveInspection(INSPECTION_ID, '   ')

    expect(send).toHaveBeenCalledWith(`/inspections/${INSPECTION_ID}/approve`, { method: 'POST', body: { comments: null } })
  })

  it('recusa comentario maior que o limite da API sem chamar a API', async () => {
    const result = await approveInspection(INSPECTION_ID, 'a'.repeat(REVIEW_TEXT_MAX_LENGTH + 1))

    expect(result.ok).toBe(false)
    expect(send).not.toHaveBeenCalled()
  })
})

describe('rejectInspection', () => {
  it('exige o perfil de supervisor', async () => {
    await rejectInspection(INSPECTION_ID, 'Foto ilegível', [])

    expect(requireRole).toHaveBeenCalledWith(['SUPERVISOR'])
  })

  it('bloqueia a reprovacao sem motivo, sem chamar a API (RN-080)', async () => {
    const result = await rejectInspection(INSPECTION_ID, '   ', [])

    expect(result).toEqual({ ok: false, message: 'Informe o motivo da reprovação.' })
    expect(send).not.toHaveBeenCalled()
  })

  it('aceita o motivo no limite da API e recusa acima dele', async () => {
    expect((await rejectInspection(INSPECTION_ID, 'a'.repeat(REVIEW_TEXT_MAX_LENGTH), [])).ok).toBe(true)

    send.mockClear()
    expect((await rejectInspection(INSPECTION_ID, 'a'.repeat(REVIEW_TEXT_MAX_LENGTH + 1), [])).ok).toBe(false)
    expect(send).not.toHaveBeenCalled()
  })

  it('envia motivo e itens a corrigir no contrato do documento 12', async () => {
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
})

describe('loadInspectionReview', () => {
  const SNAPSHOTS = [
    { id: 'i2', sectionTitle: 'Motor', sectionOrder: 2, itemCode: 'M-1', itemTitle: 'Vibração', itemDescription: null, responseType: 'NUMBER', required: false, itemOrder: 1 },
    { id: 'i1', sectionTitle: 'Geral', sectionOrder: 1, itemCode: 'G-1', itemTitle: 'Placa', itemDescription: 'Legível?', responseType: 'CONFORMITY', required: true, itemOrder: 1 },
  ]

  function respond(reviews: unknown) {
    load.mockResolvedValue({ itemSnapshots: SNAPSHOTS })
    loadInspectionDetail.mockResolvedValue({ id: INSPECTION_ID, status: 'UNDER_REVIEW' })
    loadInspectionNonConformities.mockResolvedValue([])
    loadInspectionEvidences.mockResolvedValue([])
    loadIfPermitted.mockImplementation(async (path: string) => {
      if (path.endsWith('/reviews')) return reviews
      return path === `/users/${SUPERVISOR_ID}` ? { name: 'Supervisor Demo' } : null
    })
  }

  it('compoe o detalhe, o checklist do snapshot e as revisoes com o nome de quem decidiu', async () => {
    respond([
      { id: 'r2', reviewCycle: 2, reviewerId: SUPERVISOR_ID, decision: 'APPROVED', reason: null, comments: 'Ok', itemsToCorrect: [], reviewedAt: '2026-11-18T12:00:00Z' },
      { id: 'r1', reviewCycle: 1, reviewerId: SUPERVISOR_ID, decision: 'REJECTED', reason: 'Refazer', comments: null, itemsToCorrect: ['i1'], reviewedAt: '2026-11-10T12:00:00Z' },
    ])

    const review = await loadInspectionReview(INSPECTION_ID)

    expect(load).toHaveBeenCalledWith(`/inspections/${INSPECTION_ID}`)
    expect(review.inspection.status).toBe('UNDER_REVIEW')
    expect(review.sections.map((section) => section.title)).toEqual(['Geral', 'Motor'])
    expect(review.reviews?.map(({ cycle, reviewerName, itemCodes }) => ({ cycle, reviewerName, itemCodes }))).toEqual([
      { cycle: 1, reviewerName: 'Supervisor Demo', itemCodes: ['G-1'] },
      { cycle: 2, reviewerName: 'Supervisor Demo', itemCodes: [] },
    ])
  })

  it('deixa o historico nulo quando o perfil nao pode ler as revisoes', async () => {
    respond(null)
    loadInspectionNonConformities.mockResolvedValue(null)
    loadInspectionEvidences.mockResolvedValue(null)

    const review = await loadInspectionReview(INSPECTION_ID)

    expect(review).toMatchObject({ reviews: null, nonConformities: null, evidences: null })
  })

  it('degrada o nome do revisor para nulo quando o usuario nao e legivel', async () => {
    respond([
      { id: 'r1', reviewCycle: 1, reviewerId: 'unknown', decision: 'APPROVED', reason: null, comments: null, itemsToCorrect: [], reviewedAt: '2026-11-10T12:00:00Z' },
    ])

    const review = await loadInspectionReview(INSPECTION_ID)

    expect(review.reviews?.[0]?.reviewerName).toBeNull()
  })
})
