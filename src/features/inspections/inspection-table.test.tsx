import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { InspectionTable } from '@/features/inspections/inspection-table'
import type { InspectionListItem } from '@/lib/domain/inspection-list'

const BASE: InspectionListItem = {
  id: '3d8dc050-54f4-4d3b-9e5d-5fdb29ae3ed5',
  code: 'INS-2023-089',
  title: 'Manutenção Preventiva',
  clientId: 'c1',
  clientName: 'Indústria Alpha',
  siteName: 'Galpão 3 - Setor Sul',
  equipmentName: 'Compressor GA-75',
  technicianId: 't1',
  technicianName: 'Carlos Silva',
  priority: 'HIGH',
  status: 'ASSIGNED',
  scheduledFor: '2026-10-21T12:00:00Z',
  answeredItems: 9,
  applicableItems: 36,
  updatedAt: '2026-10-21T10:00:00Z',
}

function row(code: string) {
  return screen.getByText(code).closest('tr') as HTMLElement
}

describe('InspectionTable', () => {
  it('mostra atraso, prioridade, estado e progresso em texto', () => {
    render(<InspectionTable items={[BASE]} today="2026-10-23" />)
    const line = within(row('INS-2023-089'))

    expect(line.getByText('Atrasado (2 dias)')).toBeInTheDocument()
    expect(line.getByText('Alta')).toBeInTheDocument()
    expect(line.getByText('Atribuída')).toBeInTheDocument()
    expect(line.getByText('9/36')).toBeInTheDocument()
    expect(line.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25')
    expect(line.getByText('CS')).toBeInTheDocument()
  })

  it('leva quem aguarda revisao para a tela de revisao', () => {
    render(<InspectionTable items={[{ ...BASE, code: 'INSP-2023-0892', status: 'UNDER_REVIEW' }]} today="2026-10-23" />)

    expect(screen.getByRole('link', { name: 'INSP-2023-0892' })).toHaveAttribute(
      'href',
      `/inspections/${BASE.id}/review`,
    )
    expect(screen.getByRole('link', { name: 'Revisar' })).toBeInTheDocument()
  })

  it('nao oferece revisar fora do recorte de revisao', () => {
    render(<InspectionTable items={[BASE]} today="2026-10-23" />)

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('indica quando ainda nao ha tecnico atribuido', () => {
    render(<InspectionTable items={[{ ...BASE, technicianId: null, technicianName: null }]} today="2026-10-23" />)

    expect(screen.getByText('Não atribuído')).toBeInTheDocument()
  })
})
