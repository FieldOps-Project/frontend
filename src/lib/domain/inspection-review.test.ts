import { describe, expect, it } from 'vitest'

import {
  buildSections,
  describeReview,
  reviewItems,
  reviewStage,
  suggestedItemIds,
  type ItemSnapshotRecord,
} from '@/lib/domain/inspection-review'
import type { InspectionFinding } from '@/lib/domain/non-conformity'

function snapshot(overrides: Partial<ItemSnapshotRecord>): ItemSnapshotRecord {
  return {
    id: 'i1',
    sectionTitle: 'Geral',
    sectionOrder: 1,
    itemCode: 'G-1',
    itemTitle: 'Placa',
    itemDescription: null,
    responseType: 'CONFORMITY',
    required: true,
    itemOrder: 1,
    ...overrides,
  }
}

const SNAPSHOTS = [
  snapshot({ id: 'i3', sectionTitle: 'Motor', sectionOrder: 2, itemCode: 'M-1', itemOrder: 1 }),
  snapshot({ id: 'i2', itemCode: 'G-2', itemOrder: 2 }),
  snapshot({ id: 'i1', itemCode: 'G-1', itemOrder: 1 }),
]

describe('buildSections', () => {
  it('agrupa os itens por secao e ordena secoes e itens', () => {
    const sections = buildSections(SNAPSHOTS)

    expect(sections.map((section) => [section.order, section.title])).toEqual([
      [1, 'Geral'],
      [2, 'Motor'],
    ])
    expect(reviewItems({ sections }).map((item) => item.code)).toEqual(['G-1', 'G-2', 'M-1'])
  })

  it('devolve a estrutura do item sem nenhuma resposta', () => {
    const [item] = reviewItems({ sections: buildSections([snapshot({ itemDescription: 'Legível?', required: false })]) })

    expect(item).toEqual({
      id: 'i1',
      code: 'G-1',
      title: 'Placa',
      description: 'Legível?',
      required: false,
      responseType: 'CONFORMITY',
    })
  })

  it('devolve lista vazia sem itens no snapshot', () => {
    expect(buildSections([])).toEqual([])
  })
})

describe('describeReview', () => {
  const items = reviewItems({ sections: buildSections(SNAPSHOTS) })
  const record = {
    id: 'r1',
    reviewCycle: 2,
    reviewerId: 'u1',
    decision: 'REJECTED' as const,
    reason: 'Refazer',
    comments: null,
    itemsToCorrect: ['i1', 'desconhecido'],
    reviewedAt: '2026-11-22T13:00:00Z',
  }

  it('mapeia reviewCycle para cycle e traduz os ids dos itens para codigos', () => {
    expect(describeReview(record, 'Supervisor Demo', items)).toEqual({
      id: 'r1',
      cycle: 2,
      decision: 'REJECTED',
      reviewerName: 'Supervisor Demo',
      reason: 'Refazer',
      comments: null,
      itemCodes: ['G-1'],
      reviewedAt: '2026-11-22T13:00:00Z',
    })
  })

  it('aceita nome de revisor ausente', () => {
    expect(describeReview(record, null, items).reviewerName).toBeNull()
  })
})

describe('suggestedItemIds', () => {
  const items = reviewItems({ sections: buildSections(SNAPSHOTS) })
  const finding = (itemCode: string | null): InspectionFinding => ({
    id: 'n1',
    title: 'NC',
    description: 'd',
    severity: 'HIGH',
    itemCode,
  })

  it('sugere os itens que tem nao conformidade', () => {
    expect(suggestedItemIds(items, [finding('G-2'), finding(null)])).toEqual(['i2'])
  })

  it('nao sugere nada quando o perfil nao enxerga as nao conformidades', () => {
    expect(suggestedItemIds(items, null)).toEqual([])
  })
})

describe('reviewStage', () => {
  it('so o supervisor inicia a revisao de uma inspecao enviada', () => {
    expect(reviewStage('SUPERVISOR', 'SUBMITTED')).toBe('begin')
    expect(reviewStage('ADMIN', 'SUBMITTED')).toBeNull()
  })

  it('so o supervisor decide com a inspecao em revisao (RN-079)', () => {
    expect(reviewStage('SUPERVISOR', 'UNDER_REVIEW')).toBe('decide')
    expect(reviewStage('ADMIN', 'UNDER_REVIEW')).toBeNull()
  })

  it.each(['DRAFT', 'ASSIGNED', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'CANCELED'] as const)(
    'nao oferece acao em %s',
    (status) => {
      expect(reviewStage('SUPERVISOR', status)).toBeNull()
    },
  )
})
