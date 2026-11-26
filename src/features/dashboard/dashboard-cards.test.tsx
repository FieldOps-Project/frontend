import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DashboardHeader } from '@/features/dashboard/dashboard-header'
import { DelayedInspectionsCard } from '@/features/dashboard/delayed-inspections-card'
import { PendingReviewsCard } from '@/features/dashboard/pending-reviews-card'
import { PipelineCard } from '@/features/dashboard/pipeline-card'
import { SeverityBreakdownCard } from '@/features/dashboard/severity-breakdown-card'
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
  it('leva a fila de revisao e pede acao ao supervisor quando ha pendencia', () => {
    render(<PendingReviewsCard count={45} reviewable />)

    const card = screen.getByRole('link', { name: 'Revisões Pendentes' })
    expect(card).toHaveAttribute('href', '/inspections/review-queue')
    expect(card).toHaveTextContent('45')
    expect(card).toHaveTextContent('Requer Ação')
  })

  it('so informa o numero a quem nao revisa, sem link para a fila', () => {
    render(<PendingReviewsCard count={45} reviewable={false} />)

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('45')).toBeInTheDocument()
    expect(screen.queryByText('Requer Ação')).not.toBeInTheDocument()
  })

  it('nao pede acao sem pendencia', () => {
    render(<PendingReviewsCard count={0} reviewable />)
    expect(screen.queryByText('Requer Ação')).not.toBeInTheDocument()
    expect(screen.getByText('Nada pendente')).toBeInTheDocument()
  })
})

describe('DelayedInspectionsCard', () => {
  it('leva ao filtro de atrasadas e chama atencao quando ha atraso', () => {
    render(<DelayedInspectionsCard count={18} />)

    const card = screen.getByRole('link', { name: 'Inspeções Atrasadas' })
    expect(card).toHaveAttribute('href', '/inspections?overdue=1')
    expect(card).toHaveTextContent('18')
    expect(card).toHaveTextContent('Requer Atenção')
    expect(card).toHaveClass('bg-danger-soft/30')
  })

  it('fica neutro quando nada esta atrasado', () => {
    render(<DelayedInspectionsCard count={0} />)

    const card = screen.getByRole('link', { name: 'Inspeções Atrasadas' })
    expect(card).toHaveTextContent('Nenhuma atrasada')
    expect(card).not.toHaveClass('bg-danger-soft/30')
  })
})

describe('SeverityBreakdownCard', () => {
  const counts = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 }

  it('lista as quatro criticidades da mais grave para a menos grave, com o total', () => {
    render(<SeverityBreakdownCard counts={counts} linkable={false} />)

    const items = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(items.map((item) => item.textContent)).toEqual(['Crítica4', 'Alta3', 'Média2', 'Baixa1'])
    expect(screen.getByText('Total: 10')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('leva a listagem filtrada quando quem ve pode abrir as nao conformidades', () => {
    render(<SeverityBreakdownCard counts={counts} linkable />)

    expect(screen.getByRole('link', { name: 'Crítica: 4 não conformidades' })).toHaveAttribute(
      'href',
      '/non-conformities?severity=CRITICAL',
    )
    expect(screen.getByRole('link', { name: 'Baixa: 1 não conformidade' })).toBeInTheDocument()
  })
})

describe('DashboardHeader', () => {
  it('oferece revisar pendencias so a quem revisa', () => {
    const { rerender } = render(<DashboardHeader canReview />)
    expect(screen.getByRole('link', { name: 'Revisar Pendências' })).toHaveAttribute('href', '/inspections/review-queue')

    rerender(<DashboardHeader canReview={false} />)
    expect(screen.queryByRole('link', { name: 'Revisar Pendências' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Criar Inspeção' })).toBeInTheDocument()
  })
})
