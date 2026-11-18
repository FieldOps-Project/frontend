import { describe, expect, it } from 'vitest'

import { bySeverityDesc, type NonConformityListItem } from '@/lib/domain/non-conformity'

function item(id: string, severity: NonConformityListItem['severity'], createdAtDevice: string): NonConformityListItem {
  return {
    id,
    title: id,
    description: '',
    severity,
    status: 'OPEN',
    inspectionId: 'i',
    inspectionCode: 'INS',
    clientId: 'c',
    clientName: 'Cliente',
    siteName: 'Local',
    equipmentName: null,
    itemCode: null,
    itemTitle: null,
    createdByName: 'Técnico',
    createdAtDevice,
    serverReceivedAt: null,
  }
}

describe('bySeverityDesc', () => {
  it('poe a mais grave primeiro e, empatando, a mais recente', () => {
    const sorted = [
      item('baixa', 'LOW', '2026-11-18T10:00:00Z'),
      item('alta-antiga', 'HIGH', '2026-11-10T10:00:00Z'),
      item('critica', 'CRITICAL', '2026-11-01T10:00:00Z'),
      item('alta-nova', 'HIGH', '2026-11-17T10:00:00Z'),
      item('media', 'MEDIUM', '2026-11-18T09:00:00Z'),
    ].toSorted(bySeverityDesc)

    expect(sorted.map((nc) => nc.id)).toEqual(['critica', 'alta-nova', 'alta-antiga', 'media', 'baixa'])
  })
})
