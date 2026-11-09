import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { RecentNonConformities } from '@/features/dashboard/recent-non-conformities'
import type { RecentNonConformity } from '@/lib/domain/dashboard'

const ITEM: RecentNonConformity = {
  id: 'nc-1',
  inspectionId: 'insp-1',
  inspectionCode: 'INSP-2023-0892',
  title: 'Filter housing integrity check',
  description: 'Trinca na lateral do alojamento do filtro.',
  severity: 'CRITICAL',
  siteName: 'Roof Level',
  reportedAt: '2023-10-24T10:00:00-03:00',
}

describe('RecentNonConformities', () => {
  it('lista criticidade, descricao, local e data, com link para a inspecao', () => {
    render(<RecentNonConformities items={[ITEM]} />)

    const row = screen.getAllByRole('row')[1]
    expect(row).toBeDefined()
    const cells = within(row as HTMLElement)
    expect(cells.getByText('Crítica')).toBeInTheDocument()
    expect(cells.getByText(ITEM.description)).toBeInTheDocument()
    expect(cells.getByText('Roof Level')).toBeInTheDocument()
    expect(cells.getByText('24 de out. de 2023')).toBeInTheDocument()
    expect(cells.getByRole('link', { name: /INSP-2023-0892/ })).toHaveAttribute('href', '/inspections/insp-1/review')
  })

  it('leva a todas as nao conformidades', () => {
    render(<RecentNonConformities items={[ITEM]} />)
    expect(screen.getByRole('link', { name: 'Ver Todas' })).toHaveAttribute('href', '/non-conformities')
  })

  it('mantem o cartao com mensagem quando nao ha registro', () => {
    render(<RecentNonConformities items={[]} />)
    expect(screen.getByRole('heading', { name: 'Não Conformidades Recentes' })).toBeInTheDocument()
    expect(screen.getByText('Nenhuma não conformidade registrada')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
