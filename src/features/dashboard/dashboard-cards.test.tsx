import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DelayedInspectionsCard } from '@/features/dashboard/delayed-inspections-card'
import { PendingReviewsCard } from '@/features/dashboard/pending-reviews-card'
import { PipelineCard } from '@/features/dashboard/pipeline-card'
import { emptyStatusCounts } from '@/lib/domain/dashboard'

const COUNTS = {
  ...emptyStatusCounts(),
  DRAFT: 42,
  ASSIGNED: 156,
  IN_PROGRESS: 312,
  SUBMITTED: 89,
  UNDER_REVIEW: 45,
  APPROVED: 580,
  REJECTED: 12,
  CANCELED: 8,
}

describe('PipelineCard', () => {
  it('mostra os oito estados, cada um levando a lista filtrada', () => {
    render(<PipelineCard counts={COUNTS} />)

    const links = within(screen.getByRole('list')).getAllByRole('link')
    expect(links).toHaveLength(8)
    expect(screen.getByRole('link', { name: 'Em execução: 312 inspeções' })).toHaveAttribute(
      'href',
      '/inspections?status=IN_PROGRESS',
    )
    expect(screen.getByRole('link', { name: 'Aprovada: 580 inspeções' })).toHaveAttribute('href', '/inspections?status=APPROVED')
  })

  it('soma no total ativo so o que ainda esta no fluxo', () => {
    render(<PipelineCard counts={COUNTS} />)
    expect(screen.getByText('Total ativo: 656')).toBeInTheDocument()
  })

  it('formata milhares no padrao brasileiro', () => {
    render(<PipelineCard counts={{ ...emptyStatusCounts(), ASSIGNED: 1248 }} />)
    expect(screen.getByText('Total ativo: 1.248')).toBeInTheDocument()
  })
})

describe('PendingReviewsCard', () => {
  it('leva ao filtro aguardando revisao e pede acao quando ha pendencia', () => {
    render(<PendingReviewsCard count={45} />)

    const card = screen.getByRole('link', { name: 'Revisões Pendentes' })
    expect(card).toHaveAttribute('href', '/inspections?review=1')
    expect(card).toHaveTextContent('45')
    expect(card).toHaveTextContent('Requer Ação')
  })

  it('nao pede acao sem pendencia', () => {
    render(<PendingReviewsCard count={0} />)
    expect(screen.queryByText('Requer Ação')).not.toBeInTheDocument()
    expect(screen.getByText('Nada pendente')).toBeInTheDocument()
  })
})

describe('DelayedInspectionsCard', () => {
  it('leva ao filtro de atrasadas e mostra a variacao desde ontem', () => {
    render(<DelayedInspectionsCard summary={{ overdue: 18, overdueYesterday: 15 }} />)

    const card = screen.getByRole('link', { name: 'Inspeções Atrasadas' })
    expect(card).toHaveAttribute('href', '/inspections?overdue=1')
    expect(card).toHaveTextContent('18')
    expect(card).toHaveTextContent('+3 desde ontem')
    expect(card).toHaveClass('bg-danger-soft/30')
  })

  it('fica neutro quando nada esta atrasado', () => {
    render(<DelayedInspectionsCard summary={{ overdue: 0, overdueYesterday: 2 }} />)

    const card = screen.getByRole('link', { name: 'Inspeções Atrasadas' })
    expect(card).toHaveTextContent('−2 desde ontem')
    expect(card).not.toHaveClass('bg-danger-soft/30')
  })
})
