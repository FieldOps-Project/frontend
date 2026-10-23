import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { InspectionFilters } from '@/features/inspections/inspection-filters'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

const TECHNICIANS = [{ value: 't1', label: 'Carlos Silva' }]
const CLIENTS = [{ value: 'c1', label: 'Indústria Alpha' }]

function renderFilters(filters = {}) {
  render(<InspectionFilters pathname="/inspections" filters={filters} technicians={TECHNICIANS} clients={CLIENTS} />)
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  push.mockReset()
  vi.useRealTimers()
})

describe('InspectionFilters', () => {
  it('aplica o seletor na hora, voltando a primeira pagina', () => {
    renderFilters({ review: true })

    fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'c1' } })

    expect(push).toHaveBeenCalledWith('/inspections?clientId=c1&review=1', { scroll: false })
  })

  it('liga e desliga os atalhos pela URL', () => {
    renderFilters()

    const toggle = screen.getByRole('switch', { name: 'Somente atrasadas' })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(toggle)

    expect(push).toHaveBeenCalledWith('/inspections?overdue=1', { scroll: false })
  })

  it('espera parar de digitar para buscar', () => {
    renderFilters()

    fireEvent.change(screen.getByPlaceholderText('Buscar por ID, título, cliente...'), { target: { value: 'alpha' } })
    expect(push).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(push).toHaveBeenCalledWith('/inspections?q=alpha', { scroll: false })
  })

  it('mostra os filtros ativos com nome legivel e remove um por vez', () => {
    renderFilters({ status: 'UNDER_REVIEW', clientId: 'c1' })

    expect(screen.getByText('Filtros ativos:')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Remover filtro Status: Em revisão' }))

    expect(push).toHaveBeenCalledWith('/inspections?clientId=c1', { scroll: false })
    expect(screen.getByRole('button', { name: 'Remover filtro Cliente: Indústria Alpha' })).toBeInTheDocument()
  })

  it('limpa todos os filtros', () => {
    renderFilters({ status: 'UNDER_REVIEW', overdue: true })

    fireEvent.click(screen.getByRole('button', { name: 'Limpar todos' }))

    expect(push).toHaveBeenCalledWith('/inspections', { scroll: false })
  })

  it('esconde a faixa de filtros ativos quando nao ha filtro', () => {
    renderFilters()

    expect(screen.queryByText('Filtros ativos:')).not.toBeInTheDocument()
  })
})
