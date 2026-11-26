import { describe, expect, it, vi } from 'vitest'

import type { Page } from '@/lib/domain/page'
import { lastPageHref, rangeLabel, redirectPastLastPage } from '@/lib/page-range'

const redirect = vi.fn()

vi.mock('next/navigation', () => ({ redirect: (to: string) => redirect(to) }))

function page(overrides: Partial<Page<number>>): Page<number> {
  return { content: [1], page: 0, size: 20, totalElements: 1, totalPages: 1, first: true, last: true, ...overrides }
}

const PAST_END = page({ content: [], page: 99, totalElements: 41, totalPages: 3, first: false, last: true })

describe('lastPageHref', () => {
  it('leva a pagina fora do intervalo para a ultima, mantendo os filtros', () => {
    expect(lastPageHref(PAST_END, '/clients', { search: 'alfa', status: undefined })).toBe(
      '/clients?search=alfa&page=2',
    )
  })

  it('nao mexe em pagina com itens', () => {
    expect(lastPageHref(page({}), '/clients', {})).toBeNull()
  })

  it('nao mexe em listagem realmente vazia', () => {
    expect(lastPageHref(page({ content: [], totalElements: 0, totalPages: 0 }), '/clients', {})).toBeNull()
  })
})

describe('redirectPastLastPage', () => {
  it('redireciona quando a pagina pedida passou do fim', () => {
    redirectPastLastPage(PAST_END, '/users', {})

    expect(redirect).toHaveBeenCalledWith('/users?page=2')
  })

  it('segue a renderizacao quando a pagina existe', () => {
    redirect.mockClear()

    redirectPastLastPage(page({}), '/users', {})

    expect(redirect).not.toHaveBeenCalled()
  })
})

describe('rangeLabel', () => {
  it('mostra o intervalo da pagina', () => {
    expect(rangeLabel(page({ content: [1, 2, 3], page: 1, totalElements: 23 }))).toBe('21–23 de 23')
  })

  it('nao inventa intervalo invertido para pagina vazia', () => {
    expect(rangeLabel(PAST_END)).toBe('0 de 41')
  })
})
