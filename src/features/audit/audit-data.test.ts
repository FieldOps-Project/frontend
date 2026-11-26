import { beforeEach, describe, expect, it, vi } from 'vitest'

import { loadInspectionChoices, loadInspectionTimeline, loadRecentActivity } from '@/features/audit/audit-data'
import type { InspectionHistoryEvent } from '@/lib/domain/inspection-history'

vi.mock('server-only', () => ({}))

const load = vi.fn()
const loadInspectionRecord = vi.fn()
const loadInspectionHistory = vi.fn()

vi.mock('@/lib/dal', () => ({ load: (path: string, query: unknown) => load(path, query) }))
vi.mock('@/features/inspections/detail-data', () => ({
  loadInspectionRecord: (id: string) => loadInspectionRecord(id),
  loadInspectionHistory: (id: string) => loadInspectionHistory(id),
}))

function history(id: string, occurredAt: string): InspectionHistoryEvent {
  return {
    id,
    action: 'INSPECTION_REPORT_EXPORTED',
    entityType: 'INSPECTION_REPORT',
    actorId: 'u1',
    actorName: 'Administrador Demo',
    occurredAt,
    deviceOccurredAt: null,
    previousStatus: null,
    newStatus: null,
    note: 'Formato PDF',
  }
}

beforeEach(() => {
  load.mockReset()
  loadInspectionRecord.mockReset()
  loadInspectionHistory.mockReset()
})

describe('loadInspectionTimeline', () => {
  it('traz a inspecao e o historico, do evento mais recente para o mais antigo', async () => {
    loadInspectionRecord.mockResolvedValue({ id: 'i1', title: 'Inspeção A' })
    loadInspectionHistory.mockResolvedValue([history('old', '2026-11-01T10:00:00Z'), history('new', '2026-11-02T10:00:00Z')])

    const { inspection, events } = await loadInspectionTimeline('i1')

    expect(inspection.title).toBe('Inspeção A')
    expect(events.map((event) => event.id)).toEqual(['new', 'old'])
    expect(events[0]).toMatchObject({ inspectionId: 'i1', inspectionTitle: 'Inspeção A' })
  })

  it('devolve linha do tempo vazia quando a inspecao nao tem eventos', async () => {
    loadInspectionRecord.mockResolvedValue({ id: 'i2', title: 'Inspeção B' })
    loadInspectionHistory.mockResolvedValue([])

    expect((await loadInspectionTimeline('i2')).events).toEqual([])
  })
})

describe('loadInspectionChoices', () => {
  it('busca as inspecoes visiveis ao perfil, com busca e pagina', async () => {
    load.mockResolvedValue({ content: [] })

    await loadInspectionChoices('gerador', 2)

    expect(load).toHaveBeenCalledWith('/inspections', { search: 'gerador', page: 2, size: 10, sort: 'updatedAt,desc' })
  })
})

describe('loadRecentActivity', () => {
  it('junta o historico das inspecoes mais recentes em uma lista so', async () => {
    load.mockResolvedValue({
      content: [
        { id: 'i1', title: 'Inspeção A' },
        { id: 'i2', title: 'Inspeção B' },
      ],
    })
    loadInspectionHistory.mockImplementation(async (id: string) =>
      id === 'i1' ? [history('a', '2026-11-01T10:00:00Z')] : [history('b', '2026-11-03T10:00:00Z')],
    )

    const { events, inspections } = await loadRecentActivity()

    expect(load).toHaveBeenCalledWith('/inspections', { size: 25, sort: 'updatedAt,desc' })
    expect(inspections).toBe(2)
    expect(events.map((event) => [event.id, event.inspectionTitle])).toEqual([
      ['b', 'Inspeção B'],
      ['a', 'Inspeção A'],
    ])
  })
})
