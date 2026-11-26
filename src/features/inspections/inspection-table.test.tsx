import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { InspectionTable } from '@/features/inspections/inspection-table'
import { inspectionReference } from '@/lib/domain/inspection'
import type { InspectionListItem } from '@/lib/domain/inspection-list'

const BASE: InspectionListItem = {
  id: '3d8dc050-54f4-4d3b-9e5d-5fdb29ae3ed5',
  title: 'Manutenção Preventiva',
  clientId: 'c1',
  clientName: 'Indústria Alpha',
  siteId: 's1',
  siteName: 'Galpão 3 - Setor Sul',
  equipmentId: 'e1',
  equipmentName: 'Compressor GA-75',
  technicianId: 't1',
  technicianName: 'Carlos Silva',
  priority: 'HIGH',
  status: 'ASSIGNED',
  scheduledFor: '2026-10-21T12:00:00Z',
  answeredItems: 9,
  applicableItems: 36,
  updatedAt: '2026-10-21T10:00:00Z',
  overdue: true,
}

const REFERENCE = inspectionReference(BASE.id)

function row(reference: string) {
  return screen.getByText(reference).closest('tr') as HTMLElement
}

describe('InspectionTable', () => {
  it('mostra atraso, prioridade, estado e progresso em texto', () => {
    render(<InspectionTable items={[BASE]} today="2026-10-23" canReview />)
    const line = within(row(REFERENCE))

    expect(line.getByText('Atrasada')).toBeInTheDocument()
    expect(line.getByText('Alta')).toBeInTheDocument()
    expect(line.getByText('Atribuída')).toBeInTheDocument()
    expect(line.getByText('9/36')).toBeInTheDocument()
    expect(line.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25')
    expect(line.getByText('CS')).toBeInTheDocument()
  })

  it('nao marca atraso quando a API nao sinaliza', () => {
    render(<InspectionTable items={[{ ...BASE, overdue: false }]} today="2026-10-23" canReview />)

    expect(screen.queryByText('Atrasada')).not.toBeInTheDocument()
  })

  it('abre o detalhe pela referencia da inspecao', () => {
    render(<InspectionTable items={[BASE]} today="2026-10-23" canReview />)

    expect(screen.getByRole('link', { name: REFERENCE })).toHaveAttribute('href', `/inspections/${BASE.id}`)
  })

  it('leva quem aguarda revisao direto para a tela de revisao', () => {
    render(<InspectionTable items={[{ ...BASE, status: 'UNDER_REVIEW' }]} today="2026-10-23" canReview />)

    expect(screen.getByRole('link', { name: 'Revisar' })).toHaveAttribute('href', `/inspections/${BASE.id}/review`)
  })

  it('nao oferece revisar a quem nao pode decidir a revisao', () => {
    render(<InspectionTable items={[{ ...BASE, status: 'UNDER_REVIEW' }]} today="2026-10-23" canReview={false} />)

    expect(screen.queryByRole('link', { name: 'Revisar' })).not.toBeInTheDocument()
  })

  it('nao oferece revisar fora do recorte de revisao', () => {
    render(<InspectionTable items={[BASE]} today="2026-10-23" canReview />)

    expect(screen.queryByRole('link', { name: 'Revisar' })).not.toBeInTheDocument()
  })

  it('indica quando ainda nao ha tecnico atribuido', () => {
    render(<InspectionTable items={[{ ...BASE, technicianId: null, technicianName: null }]} today="2026-10-23" canReview />)

    expect(screen.getByText('Não atribuído')).toBeInTheDocument()
  })
})
