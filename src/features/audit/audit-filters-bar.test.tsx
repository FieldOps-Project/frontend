import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AuditFiltersBar } from '@/features/audit/audit-filters-bar'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

const ID = 'd0000000-0000-4000-8000-000000000503'
const ACTORS = [{ value: 'u1', label: 'Ana Souza' }]
const ENTITIES = [{ value: 'INSPECTION', label: 'Inspeção' }]
const ACTIONS = [{ value: 'INSPECTION_APPROVED', label: 'Supervisor aprovou' }]

function renderBar(filters: Parameters<typeof AuditFiltersBar>[0]['filters'] = { period: 'all' }) {
  render(
    <AuditFiltersBar
      filters={filters}
      baseParams={{ inspectionId: ID }}
      actors={ACTORS}
      entities={ENTITIES}
      actions={ACTIONS}
    />,
  )
}

afterEach(() => {
  push.mockReset()
})

describe('AuditFiltersBar', () => {
  it('aplica o filtro na URL sem perder a inspecao escolhida', () => {
    renderBar()

    fireEvent.change(screen.getByLabelText('Usuário'), { target: { value: 'u1' } })

    expect(push).toHaveBeenCalledWith(`/audit?inspectionId=${ID}&actorId=u1`, { scroll: false })
  })

  it('oferece apenas as opcoes derivadas dos eventos', () => {
    renderBar()

    expect(screen.getByRole('option', { name: 'Supervisor aprovou' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Cliente' })).not.toBeInTheDocument()
  })

  it('limpa os filtros e mantem a inspecao', () => {
    renderBar({ period: '7d', action: 'INSPECTION_APPROVED' })

    fireEvent.click(screen.getByRole('button', { name: 'Limpar' }))

    expect(push).toHaveBeenCalledWith(`/audit?inspectionId=${ID}`, { scroll: false })
  })

  it('mantem Limpar desabilitado sem filtros ativos', () => {
    renderBar()
    expect(screen.getByRole('button', { name: 'Limpar' })).toBeDisabled()
  })
})
