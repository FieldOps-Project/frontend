import { describe, expect, it } from 'vitest'

import { evidenceSrc, groupByNonConformity, isPendingUpload, type Evidence } from '@/lib/domain/evidence'

function evidence(id: string, nonConformityId: string | null, capturedAtDevice: string, title: string | null = null): Evidence {
  return {
    id,
    description: null,
    capturedAtDevice,
    latitude: null,
    longitude: null,
    uploadedAt: '2026-11-18T12:00:00Z',
    inspectionId: 'i1',
    responseId: null,
    nonConformityId,
    nonConformityTitle: title,
    serverReceivedAt: '2026-11-18T12:00:00Z',
  }
}

describe('groupByNonConformity', () => {
  it('agrupa pela nao conformidade, da captura mais antiga a mais nova, com as soltas no fim', () => {
    const groups = groupByNonConformity([
      evidence('a', 'nc-2', '2026-11-18T10:30:00Z', 'Segundo achado'),
      evidence('b', null, '2026-11-18T10:00:00Z'),
      evidence('c', 'nc-1', '2026-11-18T10:05:00Z', 'Primeiro achado'),
      evidence('d', 'nc-1', '2026-11-18T10:02:00Z', 'Primeiro achado'),
    ])

    expect(groups.map((group) => group.title)).toEqual(['Primeiro achado', 'Segundo achado', null])
    expect(groups[0]?.evidences.map((item) => item.id)).toEqual(['d', 'c'])
    expect(groups[2]?.nonConformityId).toBeNull()
  })
})

describe('evidencias', () => {
  it('pede a imagem ao Route Handler, nunca a API direto', () => {
    expect(evidenceSrc('e1')).toBe('/api/evidence/e1')
  })

  it('reconhece o arquivo ainda nao enviado', () => {
    expect(isPendingUpload({ uploadedAt: null })).toBe(true)
    expect(isPendingUpload({ uploadedAt: '2026-11-18T12:00:00Z' })).toBe(false)
  })
})
