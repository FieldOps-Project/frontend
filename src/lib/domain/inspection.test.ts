import { describe, expect, it } from 'vitest'

import { inspectionReference } from '@/lib/domain/inspection'

describe('inspectionReference', () => {
  it('derives a stable short reference from the end of the inspection id', () => {
    expect(inspectionReference('9b2f4c1e-7a3d-4e58-8c0a-5d1e2f3a4b5c')).toBe('INS-2F3A4B5C')
  })

  it('tells apart ids that share their first digits', () => {
    const first = inspectionReference('d0000000-0000-0000-0000-000000000501')
    const second = inspectionReference('d0000000-0000-0000-0000-000000000502')
    expect(first).not.toBe(second)
  })
})
