import { afterEach, describe, expect, it, vi } from 'vitest'

import { loadInspectionDetail, loadInspectionHistory } from '@/features/inspections/detail-data'

vi.mock('server-only', () => ({}))
vi.mock('@/features/catalog/lookups', () => ({ loadActiveUsers: vi.fn() }))

const load = vi.fn()
const loadIfPermitted = vi.fn()

vi.mock('@/lib/dal', () => ({
  load: (path: string) => load(path),
  loadIfPermitted: (path: string) => loadIfPermitted(path),
}))

const ID = 'd0000000-0000-4000-8000-000000000501'
const TECHNICIAN = 'd0000000-0000-4000-8000-000000000003'
const SUPERVISOR = 'd0000000-0000-4000-8000-000000000002'

const INSPECTION = {
  id: ID,
  templateVersionId: 'tv1',
  clientId: 'c1',
  siteId: 's1',
  equipmentId: 'e1',
  technicianId: TECHNICIAN,
  supervisorId: SUPERVISOR,
  title: 'Inspeção preventiva',
  instructions: null,
  priority: 'HIGH',
  status: 'IN_PROGRESS',
  scheduledFor: '2026-11-20T12:00:00Z',
  createdAt: '2026-11-18T12:00:00Z',
  updatedAt: '2026-11-18T12:00:00Z',
  itemSnapshots: [{ id: 'a' }, { id: 'b' }],
}

const HISTORY = [
  {
    id: 'h1',
    action: 'INSPECTION_STARTED',
    entityType: 'INSPECTION',
    entityId: ID,
    actorId: TECHNICIAN,
    actorName: 'Técnico Demo',
    occurredAt: '2026-11-20T15:05:00Z',
    deviceOccurredAt: '2026-11-20T12:00:00Z',
    requestId: null,
    deviceId: null,
    previousValue: 'status=ASSIGNED',
    newValue: 'status=IN_PROGRESS;startedAtDevice=2026-11-20T12:00:00Z;startedAtServer=2026-11-20T15:05:00Z',
  },
]

function respond(overrides: Record<string, unknown> = {}) {
  const responses: Record<string, unknown> = {
    [`/inspections/${ID}`]: INSPECTION,
    [`/inspections/${ID}/history`]: HISTORY,
    '/inspection-template-versions/tv1': { title: 'Checklist de geradores', versionNumber: 3 },
    '/clients/c1': { name: 'Indústria ABC' },
    '/sites/s1': { name: 'Fábrica Sorocaba' },
    ...overrides,
  }
  load.mockImplementation(async (path: string) => responses[path])
  loadIfPermitted.mockImplementation(async (path: string) => responses[path] ?? null)
}

afterEach(() => {
  load.mockReset()
  loadIfPermitted.mockReset()
})

describe('loadInspectionDetail', () => {
  it('compoe o detalhe com os nomes lidos da API e os horarios do historico', async () => {
    respond({
      '/equipment/e1': { name: 'Gerador GD-001' },
      [`/users/${TECHNICIAN}`]: { name: 'Técnico Demo' },
      [`/users/${SUPERVISOR}`]: { name: 'Supervisor Demo' },
    })

    expect(await loadInspectionDetail(ID)).toMatchObject({
      id: ID,
      templateTitle: 'Checklist de geradores',
      templateVersionNumber: 3,
      clientName: 'Indústria ABC',
      siteName: 'Fábrica Sorocaba',
      equipmentName: 'Gerador GD-001',
      technicianName: 'Técnico Demo',
      supervisorName: 'Supervisor Demo',
      applicableItems: 2,
      startedAtDevice: '2026-11-20T12:00:00Z',
      startedAtServer: '2026-11-20T15:05:00Z',
      submittedAtServer: null,
    })
  })

  it('degrada para nome nulo quando a API nega ou nao acha a pessoa', async () => {
    respond()

    expect(await loadInspectionDetail(ID)).toMatchObject({
      technicianId: TECHNICIAN,
      technicianName: null,
      supervisorName: null,
      equipmentName: null,
    })
  })

  it('nao consulta equipamento nem pessoas que a inspecao nao tem', async () => {
    respond({ [`/inspections/${ID}`]: { ...INSPECTION, equipmentId: null, technicianId: null, supervisorId: null } })

    expect(await loadInspectionDetail(ID)).toMatchObject({ equipmentId: null, technicianName: null, supervisorName: null })
    expect(loadIfPermitted).not.toHaveBeenCalled()
  })
})

describe('loadInspectionHistory', () => {
  it('traduz o historico da API em eventos com o estado derivado', async () => {
    respond()

    expect(await loadInspectionHistory(ID)).toEqual([
      {
        id: 'h1',
        action: 'INSPECTION_STARTED',
        entityType: 'INSPECTION',
        actorId: TECHNICIAN,
        actorName: 'Técnico Demo',
        occurredAt: '2026-11-20T15:05:00Z',
        deviceOccurredAt: '2026-11-20T12:00:00Z',
        previousStatus: 'ASSIGNED',
        newStatus: 'IN_PROGRESS',
        note: null,
      },
    ])
  })
})
