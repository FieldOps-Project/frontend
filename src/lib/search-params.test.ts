import { describe, expect, it } from 'vitest'

import { idParam } from '@/lib/search-params'

describe('idParam', () => {
  it('aceita UUID', () => {
    const id = 'd0000000-0000-4000-8000-000000000101'

    expect(idParam({ clientId: id }, 'clientId')).toBe(id)
  })

  it('ignora valor que nao e UUID, que a API recusaria com 400', () => {
    expect(idParam({ clientId: 'abc' }, 'clientId')).toBeUndefined()
    expect(idParam({ clientId: '../users' }, 'clientId')).toBeUndefined()
    expect(idParam({}, 'clientId')).toBeUndefined()
  })
})
