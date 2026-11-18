import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { loadInspectionDetail, loadInspectionHistory } from '@/features/inspections/detail-data'
import { recordDemoInspectionChange, resetDemoInspections } from '@/features/inspections/inspection-demo-store'
import { demoInspections } from '@/features/inspections/list-fixture'
import { DEMO_REVIEW_ID } from '@/features/inspections/review-fixture'

vi.mock('server-only', () => ({}))

class NotFoundSignal extends Error {}

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new NotFoundSignal()
  },
}))

const load = vi.fn()
const loadOptional = vi.fn()

vi.mock('@/lib/dal', () => ({
  load: (path: string) => load(path),
  loadOptional: (path: string) => loadOptional(path),
}))

vi.mock('@/features/catalog/lookups', () => ({ loadActiveUsers: async () => [] }))

const ASSIGNED_ID = 'c0000000-0000-4000-8000-000000000089'
const CANCELED_ID = 'c0000000-0000-4000-8000-000000000097'
const API_ID = '3d8dc050-54f4-4d3b-9e5d-5fdb29ae3ed5'

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'development')
  resetDemoInspections()
})

afterEach(() => {
  vi.unstubAllEnvs()
  load.mockReset()
  loadOptional.mockReset()
})

describe('detalhe de demonstracao', () => {
  it('abre toda inspecao da listagem com os mesmos dados de planejamento', async () => {
    for (const item of demoInspections()) {
      const detail = await loadInspectionDetail(item.id)
      expect(detail).toMatchObject({ code: item.code, status: item.status, clientName: item.clientName })
    }
  })

  it('so tem horarios de execucao depois que o tecnico inicia', async () => {
    const assigned = await loadInspectionDetail(ASSIGNED_ID)
    expect(assigned.startedAtDevice).toBeNull()
    expect(assigned.startLocation).toBeNull()

    const reviewed = await loadInspectionDetail(DEMO_REVIEW_ID)
    expect(reviewed.startedAtDevice).not.toBeNull()
    expect(reviewed.startLocation?.accuracy).not.toBeNull()
    expect(Date.parse(reviewed.submittedAtServer ?? '')).toBeGreaterThan(Date.parse(reviewed.completedAtDevice ?? ''))
  })

  it('registra quem cancelou, quando e por que (RN-029)', async () => {
    const canceled = await loadInspectionDetail(CANCELED_ID)
    expect(canceled).toMatchObject({ status: 'CANCELED', canceledByName: expect.any(String), canceledReason: expect.any(String) })
    const history = await loadInspectionHistory(CANCELED_ID)
    expect(history?.at(-1)).toMatchObject({ action: 'INSPECTION_CANCELED', newStatus: 'CANCELED' })
  })

  it('monta o historico em ordem, terminando no estado atual', async () => {
    const history = (await loadInspectionHistory(DEMO_REVIEW_ID)) ?? []
    expect(history.flatMap((event) => (event.newStatus ? [event.newStatus] : []))).toEqual([
      'DRAFT',
      'ASSIGNED',
      'IN_PROGRESS',
      'SUBMITTED',
      'UNDER_REVIEW',
    ])
    const times = history.map((event) => Date.parse(event.deviceOccurredAt ?? event.occurredAt))
    expect(times).toEqual([...times].sort((a, b) => a - b))
  })

  it('inclui fotografias e nao conformidades na linha do tempo (issue #24)', async () => {
    const actions = ((await loadInspectionHistory(DEMO_REVIEW_ID)) ?? []).map((event) => event.action)
    expect(actions).toContain('EVIDENCE_ADDED')
    expect(actions).toContain('NON_CONFORMITY_CREATED')
  })

  it('mostra na listagem, no detalhe e no historico o que foi mudado na demonstracao', async () => {
    recordDemoInspectionChange(
      ASSIGNED_ID,
      { status: 'CANCELED', canceledByName: 'Ana Supervisora', canceledReason: 'Teste', canceledAt: '2026-11-18T12:00:00Z' },
      {
        id: 'e1',
        action: 'INSPECTION_CANCELED',
        actorName: 'Ana Supervisora',
        occurredAt: '2026-11-18T12:00:00Z',
        deviceOccurredAt: null,
        previousStatus: 'ASSIGNED',
        newStatus: 'CANCELED',
        note: 'Teste',
      },
    )

    expect(demoInspections().find((item) => item.id === ASSIGNED_ID)?.status).toBe('CANCELED')
    expect(await loadInspectionDetail(ASSIGNED_ID)).toMatchObject({ status: 'CANCELED', canceledReason: 'Teste' })
    expect((await loadInspectionHistory(ASSIGNED_ID))?.at(-1)?.note).toBe('Teste')
  })
})

describe('fora da demonstracao', () => {
  it('le o detalhe e o historico da API', async () => {
    load.mockResolvedValue({ id: API_ID })
    loadOptional.mockResolvedValue(null)

    await loadInspectionDetail(API_ID)
    expect(load).toHaveBeenCalledWith(`/inspections/${API_ID}`)
    expect(await loadInspectionHistory(API_ID)).toBeNull()
    expect(loadOptional).toHaveBeenCalledWith(`/inspections/${API_ID}/history`)
  })

  it('nao serve a demonstracao fora do ambiente de desenvolvimento', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'production')
    load.mockResolvedValue({ id: ASSIGNED_ID })

    await loadInspectionDetail(ASSIGNED_ID)
    expect(load).toHaveBeenCalledWith(`/inspections/${ASSIGNED_ID}`)
  })
})
