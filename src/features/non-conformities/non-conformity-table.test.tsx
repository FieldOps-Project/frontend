import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { parseNonConformityFilters } from '@/features/non-conformities/list-filters'
import { NonConformityTable } from '@/features/non-conformities/non-conformity-table'
import type { NonConformityListItem } from '@/lib/domain/non-conformity'

const ITEM: NonConformityListItem = {
  id: '9c000000-0000-4000-8000-000000000001',
  title: 'Filter housing integrity check',
  description: 'Trinca na lateral do alojamento do filtro.',
  severity: 'CRITICAL',
  status: 'OPEN',
  inspectionId: '7c1e2f3a-0892-4d6b-9a10-2023d0000892',
  inspectionCode: 'INSP-2023-0892',
  clientId: 'b0000000-0000-4000-8000-000000000001',
  clientName: 'Indústria Alpha',
  siteName: 'Roof Level',
  equipmentName: 'HVAC Unit B',
  itemCode: '1.2',
  itemTitle: 'Filter housing integrity check',
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
    expect(table.getByRole('link', { name: 'INSP-2023-0892' })).toHaveAttribute('href', `/inspections/${ITEM.inspectionId}`)
  })

  it('nao oferece mudanca de estado, que a API nao suporta', () => {
    render(<NonConformityTable items={[ITEM]} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('parseNonConformityFilters', () => {
  it('le os filtros validos da URL e ignora os desconhecidos', () => {
    expect(parseNonConformityFilters({ severity: 'HIGH', clientId: 'c1', from: '2026-11-01', to: 'ontem' })).toEqual({
      severity: 'HIGH',
      clientId: 'c1',
      from: '2026-11-01',
      to: undefined,
    })
    expect(parseNonConformityFilters({ severity: 'URGENTE' }).severity).toBeUndefined()
  })
})
