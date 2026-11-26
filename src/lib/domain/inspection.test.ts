import { describe, expect, it } from 'vitest'

import { inspectionReference } from '@/lib/domain/inspection'

describe('inspectionReference', () => {
  it('derives a stable short reference from the inspection id', () => {
    expect(inspectionReference('9b2f4c1e-7a3d-4e58-8c0a-5d1e2f3a4b5c')).toBe('INS-9B2F4C1E')
  })

  it('is deterministic for the same id', () => {
    const id = '00000000-0000-4000-8000-000000000501'
    expect(inspectionReference(id)).toBe(inspectionReference(id))
  })
})
