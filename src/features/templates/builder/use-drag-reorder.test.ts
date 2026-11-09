import { describe, expect, it } from 'vitest'

import { reordered } from '@/features/templates/builder/use-drag-reorder'

describe('reordered', () => {
  it('leva o arrastado para a posicao do alvo', () => {
    expect(reordered(['a', 'b', 'c', 'd'], 'a', 'c')).toEqual(['b', 'c', 'a', 'd'])
    expect(reordered(['a', 'b', 'c', 'd'], 'd', 'b')).toEqual(['a', 'd', 'b', 'c'])
  })

  it('devolve a mesma lista quando nada muda', () => {
    const ids = ['a', 'b']
    expect(reordered(ids, 'a', 'a')).toBe(ids)
    expect(reordered(ids, 'x', 'a')).toBe(ids)
  })
})
