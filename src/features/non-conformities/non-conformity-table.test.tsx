import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { parseNonConformityFilters } from '@/features/non-conformities/list-filters'
import { NonConformityTable } from '@/features/non-conformities/non-conformity-table'
import type { NonConformityListItem } from '@/lib/domain/non-conformity'

const ITEM: NonConformityListItem = {
  id: '9c000000-0000-4000-8000-000000000001',
  title: 'Etiqueta de segurança danificada',
  description: 'Etiqueta de risco elétrico parcialmente ilegível.',
  severity: 'CRITICAL',
  status: 'OPEN',
  inspectionId: '7c1e2f3a-0892-4d6b-9a10-2023d0000892',
  inspectionCode: 'INS-7C1E2F3A',
  inspectionTitle: 'Inspeção preventiva mensal',
  clientName: 'Indústria Alpha',
  siteName: 'Fábrica Sorocaba',
  equipmentName: 'Gerador GD-001',
  itemCode: 'GER-SEG-002',
  itemTitle: 'Sinalização de segurança',
  itemQuestion: 'As etiquetas estão legíveis?',
  createdByName: 'Carlos Mendes',
  createdAtDevice: '2026-11-17T11:40:00Z',
  serverReceivedAt: '2026-11-17T20:00:00Z',
}

describe('NonConformityTable', () => {
  it('escreve a criticidade e leva ao detalhe e a inspecao (RN-054)', () => {
    render(<NonConformityTable items={[ITEM]} />)
    const table = within(screen.getByRole('table'))

    expect(table.getByText('Crítica')).toBeInTheDocument()
    expect(table.getByRole('link', { name: ITEM.title })).toHaveAttribute('href', `/non-conformities/${ITEM.id}`)
    expect(table.getByRole('link', { name: 'INS-7C1E2F3A' })).toHaveAttribute('href', `/inspections/${ITEM.inspectionId}`)
    expect(table.getByText('Inspeção preventiva mensal')).toBeInTheDocument()
    expect(table.getByText('por Carlos Mendes')).toBeInTheDocument()
  })

  it('mostra traco e omite o que a API nao deixa resolver', () => {
    render(<NonConformityTable items={[{ ...ITEM, clientName: null, siteName: null, createdByName: null, inspectionTitle: null }]} />)
    const table = within(screen.getByRole('table'))

    expect(table.getByText('—')).toBeInTheDocument()
    expect(table.queryByText(/^por /)).not.toBeInTheDocument()
  })

  it('nao oferece mudanca de estado, que a API nao suporta', () => {
    render(<NonConformityTable items={[ITEM]} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('parseNonConformityFilters', () => {
  it('le so os filtros que a API aceita e ignora valor desconhecido', () => {
    expect(parseNonConformityFilters({ severity: 'HIGH', clientId: 'c1', from: '2026-11-01', sort: 'severity' })).toEqual({
      severity: 'HIGH',
      clientId: 'c1',
    })
    expect(parseNonConformityFilters({ severity: 'URGENTE' }).severity).toBeUndefined()
  })
})
