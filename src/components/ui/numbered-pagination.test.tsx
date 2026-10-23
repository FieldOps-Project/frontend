import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { NumberedPagination, pageWindow } from '@/components/ui/numbered-pagination'
import type { Page } from '@/lib/domain/page'

function page(current: number, totalElements: number, size = 10): Page<number> {
  const totalPages = Math.ceil(totalElements / size)
  const count = Math.min(size, totalElements - current * size)
  return {
    content: Array.from({ length: count }, (_, index) => index),
    page: current,
    size,
    totalElements,
    totalPages,
    first: current === 0,
    last: current === totalPages - 1,
  }
}

describe('pageWindow', () => {
  it('mostra todas quando cabem', () => {
    expect(pageWindow(0, 4)).toEqual([0, 1, 2, 3])
  })

  it('abre reticencias entre o comeco, a atual e o fim', () => {
    expect(pageWindow(0, 13)).toEqual([0, 1, 2, 'gap', 12])
    expect(pageWindow(6, 13)).toEqual([0, 'gap', 5, 6, 7, 'gap', 12])
    expect(pageWindow(12, 13)).toEqual([0, 'gap', 10, 11, 12])
  })
})

describe('NumberedPagination', () => {
  it('conta o intervalo mostrado e marca a pagina atual', () => {
    render(<NumberedPagination page={page(0, 124)} pathname="/inspections" params={{ review: '1' }} />)

    expect(screen.getByRole('navigation', { name: 'Paginação' })).toHaveTextContent('Mostrando 1 a 10 de 124 resultados')
    expect(screen.getByRole('link', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText('Anterior')).toHaveAttribute('aria-disabled', 'true')
  })

  it('preserva os filtros nos links de pagina', () => {
    render(<NumberedPagination page={page(0, 124)} pathname="/inspections" params={{ review: '1' }} />)

    expect(screen.getByRole('link', { name: 'Página 2' })).toHaveAttribute('href', '/inspections?review=1&page=1')
    expect(screen.getByRole('link', { name: 'Próxima' })).toHaveAttribute('href', '/inspections?review=1&page=1')
  })

  it('some quando nao ha resultado', () => {
    const { container } = render(<NumberedPagination page={page(0, 0)} pathname="/inspections" params={{}} />)

    expect(container).toBeEmptyDOMElement()
  })
})
