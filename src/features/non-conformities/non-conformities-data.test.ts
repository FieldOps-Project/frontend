import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  loadInspectionNonConformities,
  loadNonConformity,
  loadNonConformityListing,
} from '@/features/non-conformities/non-conformities-data'
import type { NonConformityInspection, NonConformityRecord } from '@/lib/domain/non-conformity'

vi.mock('server-only', () => ({}))

const load = vi.fn()
const loadOptional = vi.fn()
const verifySession = vi.fn()

vi.mock('@/lib/dal', () => ({
  load: (path: string, query?: unknown) => load(path, query),
  loadOptional: (path: string, query?: unknown) => loadOptional(path, query),
  verifySession: () => verifySession(),
}))
vi.mock('@/features/catalog/lookups', () => ({
  loadClients: async () => [{ id: 'client-1', name: 'Indústria ABC' }],
  loadSites: async () => [{ id: 'site-1', name: 'Fábrica Sorocaba' }],
  loadEquipment: async () => [{ id: 'equipment-1', name: 'Gerador GD-001' }],
}))

function record(id: string, inspectionId: string, overrides: Partial<NonConformityRecord> = {}): NonConformityRecord {
  return {
    id,
    inspectionId,
    inspectionItemId: 'item-1',
    title: `NC ${id}`,
    description: '',
    severity: 'MEDIUM',
    status: 'OPEN',
    createdBy: 'user-1',
    createdAtDevice: '2026-11-16T12:16:00Z',
    serverReceivedAt: '2026-11-16T12:17:00Z',
    ...overrides,
  }
}

function inspection(id: string): NonConformityInspection {
  return {
    id,
    title: `Inspeção ${id}`,
    clientId: 'client-1',
    siteId: 'site-1',
    equipmentId: 'equipment-1',
    itemSnapshots: [{ id: 'item-1', itemCode: 'GER-001', itemTitle: 'Placa', itemDescription: 'A placa está legível?' }],
  }
}

function page(content: readonly NonConformityRecord[]) {
  return { content, page: 0, size: 20, totalElements: content.length, totalPages: 1, first: true, last: true }
}

function routeApi(routes: Record<string, unknown>) {
  const answer = async (path: string) => (path in routes ? routes[path] : null)
  load.mockImplementation(answer)
  loadOptional.mockImplementation(answer)
}

beforeEach(() => {
  verifySession.mockResolvedValue({ id: 'u1', role: 'SUPERVISOR' })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('loadNonConformityListing', () => {
  it('manda so os filtros que a API aceita, com a pagina pedida', async () => {
    routeApi({ '/non-conformities': page([]), '/users': { content: [] } })

    await loadNonConformityListing({ severity: 'CRITICAL', clientId: 'client-1' }, 2)

    expect(load).toHaveBeenCalledWith('/non-conformities', { severity: 'CRITICAL', clientId: 'client-1', page: 2, size: 20 })
  })

  it('consulta cada inspecao uma so vez, mesmo com varias nao conformidades nela', async () => {
    routeApi({
      '/non-conformities': page([record('a', 'insp-1'), record('b', 'insp-1'), record('c', 'insp-2')]),
      '/inspections/insp-1': inspection('insp-1'),
      '/inspections/insp-2': inspection('insp-2'),
      '/users': { content: [{ id: 'user-1', name: 'Técnico Demo' }] },
    })

    const { page: result, clients } = await loadNonConformityListing({}, 0)

    const inspectionCalls = loadOptional.mock.calls.filter(([path]) => String(path).startsWith('/inspections/'))
    expect(inspectionCalls).toHaveLength(2)
    expect(result.content.map((item) => item.inspectionTitle)).toEqual(['Inspeção insp-1', 'Inspeção insp-1', 'Inspeção insp-2'])
    expect(result.content[0]).toMatchObject({
      clientName: 'Indústria ABC',
      siteName: 'Fábrica Sorocaba',
      equipmentName: 'Gerador GD-001',
      itemCode: 'GER-001',
      createdByName: 'Técnico Demo',
    })
    expect(clients).toEqual([{ value: 'client-1', label: 'Indústria ABC' }])
  })

  it('mantem a ordem e a paginacao que a API devolveu', async () => {
    routeApi({
      '/non-conformities': { ...page([record('a', 'insp-1'), record('b', 'insp-1')]), page: 3, totalPages: 9, totalElements: 180 },
      '/inspections/insp-1': inspection('insp-1'),
    })

    const { page: result } = await loadNonConformityListing({}, 3)

    expect(result.content.map((item) => item.id)).toEqual(['a', 'b'])
    expect(result).toMatchObject({ page: 3, totalPages: 9, totalElements: 180 })
  })

  it('segue sem os nomes que nao consegue resolver', async () => {
    routeApi({ '/non-conformities': page([record('a', 'insp-1')]) })

    const { page: result } = await loadNonConformityListing({}, 0)

    expect(result.content[0]).toMatchObject({ inspectionTitle: null, clientName: null, createdByName: null })
  })
})

describe('loadNonConformity', () => {
  it('traz so as evidencias da propria nao conformidade, da mais antiga a mais nova', async () => {
    const photo = (id: string, nonConformityId: string | null, capturedAtDevice: string) => ({
      id,
      nonConformityId,
      capturedAtDevice,
      inspectionId: 'insp-1',
      responseId: null,
      description: null,
      latitude: null,
      longitude: null,
      uploadedAt: '2026-11-16T13:00:00Z',
      serverReceivedAt: '2026-11-16T13:00:00Z',
    })
    routeApi({
      '/non-conformities/a': record('a', 'insp-1'),
      '/inspections/insp-1': inspection('insp-1'),
      '/inspections/insp-1/evidence': [
        photo('e2', 'a', '2026-11-16T12:20:00Z'),
        photo('outra', 'b', '2026-11-16T12:10:00Z'),
        photo('e1', 'a', '2026-11-16T12:18:00Z'),
        photo('solta', null, '2026-11-16T12:00:00Z'),
      ],
      '/users': { content: [] },
    })

    const detail = await loadNonConformity('a')

    expect(detail.evidences.map((evidence) => evidence.id)).toEqual(['e1', 'e2'])
    expect(detail.itemQuestion).toBe('A placa está legível?')
  })
})

describe('loadInspectionNonConformities', () => {
  it('lista os achados da inspecao do mais grave para o menos grave, com o item de cada um', async () => {
    routeApi({
      '/non-conformities': page([
        record('baixa', 'insp-1', { severity: 'LOW' }),
        record('critica', 'insp-1', { severity: 'CRITICAL' }),
      ]),
      '/inspections/insp-1': inspection('insp-1'),
    })

    const findings = await loadInspectionNonConformities('insp-1')

    expect(load).toHaveBeenCalledWith('/non-conformities', { inspectionId: 'insp-1', size: 100 })
    expect(findings?.map((finding) => [finding.id, finding.itemCode])).toEqual([
      ['critica', 'GER-001'],
      ['baixa', 'GER-001'],
    ])
  })

  it.each(['ADMIN', 'TECHNICIAN'])('nao consulta a API para o perfil %s, que ela recusaria', async (role) => {
    verifySession.mockResolvedValue({ id: 'u2', role })

    expect(await loadInspectionNonConformities('insp-1')).toBeNull()
    expect(load).not.toHaveBeenCalled()
    expect(loadOptional).not.toHaveBeenCalled()
  })
})
