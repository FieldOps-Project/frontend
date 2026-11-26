import { describe, expect, it } from 'vitest'

import {
  bySeverityDesc,
  describeNonConformity,
  type NonConformityInspection,
  type NonConformityLookups,
  type NonConformityRecord,
} from '@/lib/domain/non-conformity'

function record(overrides: Partial<NonConformityRecord> = {}): NonConformityRecord {
  return {
    id: 'nc-1',
    inspectionId: 'd0000000-0000-4000-8000-000000000504',
    inspectionItemId: 'item-2',
    title: 'Etiqueta de segurança danificada',
    description: 'Etiqueta parcialmente ilegível.',
    severity: 'MEDIUM',
    status: 'OPEN',
    createdBy: 'user-1',
    createdAtDevice: '2026-11-16T12:16:00Z',
    serverReceivedAt: '2026-11-16T12:17:00Z',
    ...overrides,
  }
}

const INSPECTION: NonConformityInspection = {
  id: 'd0000000-0000-4000-8000-000000000504',
  title: 'Inspeção preventiva mensal',
  clientId: 'client-1',
  siteId: 'site-1',
  equipmentId: 'equipment-1',
  itemSnapshots: [
    { id: 'item-1', itemCode: 'GER-001', itemTitle: 'Placa', itemDescription: 'A placa está legível?' },
    { id: 'item-2', itemCode: 'GER-002', itemTitle: 'Sinalização', itemDescription: 'As etiquetas estão legíveis?' },
  ],
}

const LOOKUPS: NonConformityLookups = {
  inspections: new Map([[INSPECTION.id, INSPECTION]]),
  clients: new Map([['client-1', 'Indústria ABC']]),
  sites: new Map([['site-1', 'Fábrica Sorocaba']]),
  equipment: new Map([['equipment-1', 'Gerador GD-001']]),
  users: new Map([['user-1', 'Técnico Demo']]),
}

describe('describeNonConformity', () => {
  it('resolve inspecao, nomes, item de origem e autor a partir dos indices', () => {
    expect(describeNonConformity(record(), LOOKUPS)).toEqual({
      id: 'nc-1',
      title: 'Etiqueta de segurança danificada',
      description: 'Etiqueta parcialmente ilegível.',
      severity: 'MEDIUM',
      status: 'OPEN',
      inspectionId: INSPECTION.id,
      inspectionCode: 'INS-D0000000',
      inspectionTitle: 'Inspeção preventiva mensal',
      clientName: 'Indústria ABC',
      siteName: 'Fábrica Sorocaba',
      equipmentName: 'Gerador GD-001',
      itemCode: 'GER-002',
      itemTitle: 'Sinalização',
      itemQuestion: 'As etiquetas estão legíveis?',
      createdByName: 'Técnico Demo',
      createdAtDevice: '2026-11-16T12:16:00Z',
      serverReceivedAt: '2026-11-16T12:17:00Z',
    })
  })

  it('deixa nulo o que nao da para resolver, sem inventar valor', () => {
    const empty: NonConformityLookups = {
      inspections: new Map(),
      clients: new Map(),
      sites: new Map(),
      equipment: new Map(),
      users: new Map(),
    }

    expect(describeNonConformity(record(), empty)).toMatchObject({
      inspectionCode: 'INS-D0000000',
      inspectionTitle: null,
      clientName: null,
      siteName: null,
      equipmentName: null,
      itemCode: null,
      createdByName: null,
    })
  })

  it('nao liga item quando a nao conformidade vale para a inspecao toda', () => {
    expect(describeNonConformity(record({ inspectionItemId: null }), LOOKUPS)).toMatchObject({
      itemCode: null,
      itemTitle: null,
      itemQuestion: null,
    })
  })
})

describe('bySeverityDesc', () => {
  it('poe a mais grave primeiro e, empatando, a mais recente', () => {
    const sorted = [
      record({ id: 'baixa', severity: 'LOW', createdAtDevice: '2026-11-18T10:00:00Z' }),
      record({ id: 'alta-antiga', severity: 'HIGH', createdAtDevice: '2026-11-10T10:00:00Z' }),
      record({ id: 'critica', severity: 'CRITICAL', createdAtDevice: '2026-11-01T10:00:00Z' }),
      record({ id: 'alta-nova', severity: 'HIGH', createdAtDevice: '2026-11-17T10:00:00Z' }),
      record({ id: 'media', severity: 'MEDIUM', createdAtDevice: '2026-11-18T09:00:00Z' }),
    ].toSorted(bySeverityDesc)

    expect(sorted.map((nc) => nc.id)).toEqual(['critica', 'alta-nova', 'alta-antiga', 'media', 'baixa'])
  })
})
