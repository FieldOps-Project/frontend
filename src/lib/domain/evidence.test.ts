import { describe, expect, it } from 'vitest'

import { evidenceSrc, groupByItem, isPendingUpload, type Evidence } from '@/lib/domain/evidence'

function evidence(id: string, itemCode: string | null, capturedAtDevice: string): Evidence {
  return {
    id,
    description: null,
    capturedAtDevice,
    latitude: null,
    longitude: null,
    uploadedAt: '2026-11-18T12:00:00Z',
    inspectionId: 'i1',
    responseId: null,
    nonConformityId: null,
    itemId: itemCode ? `item-${itemCode}` : null,
    itemCode,
    itemTitle: itemCode ? `Pergunta ${itemCode}` : null,
    serverReceivedAt: null,
  }
}

describe('groupByItem', () => {
  it('agrupa pelo item na ordem do checklist, com as sem item no fim (RN-045)', () => {
    const groups = groupByItem([
      evidence('a', '1.10', '2026-11-18T10:00:00Z'),
      evidence('b', null, '2026-11-18T10:01:00Z'),
      evidence('c', '1.9', '2026-11-18T10:05:00Z'),
      evidence('d', '1.9', '2026-11-18T10:02:00Z'),
    ])

    expect(groups.map((group) => group.itemCode)).toEqual(['1.9', '1.10', null])
    expect(groups[0]?.evidences.map((item) => item.id)).toEqual(['d', 'c'])
  })
})

describe('evidencias', () => {
  it('pede miniatura ou original ao Route Handler, nunca a API direto', () => {
    expect(evidenceSrc('e1', 'thumbnail')).toBe('/api/evidence/e1?variant=thumbnail')
  })

  it('reconhece o arquivo ainda nao enviado', () => {
    expect(isPendingUpload({ uploadedAt: null })).toBe(true)
    expect(isPendingUpload({ uploadedAt: '2026-11-18T12:00:00Z' })).toBe(false)
  })
})
