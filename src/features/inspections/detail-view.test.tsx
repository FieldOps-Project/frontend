import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  CancellationNotice,
  DetailHeader,
  ExecutionDetails,
  PlanningDetails,
  StatusHistory,
} from '@/features/inspections/detail-view'
import { inspectionReference } from '@/lib/domain/inspection'
import type { InspectionDetail } from '@/lib/domain/inspection-detail'
import type { InspectionHistoryEvent } from '@/lib/domain/inspection-history'

const DETAIL: InspectionDetail = {
  id: 'd0000000-0000-4000-8000-000000000501',
  title: 'Inspeção preventiva - Gerador GD-001',
  status: 'ASSIGNED',
  priority: 'MEDIUM',
  templateVersionId: 'tv1',
  templateTitle: 'Checklist de geradores',
  templateVersionNumber: 1,
  clientId: 'c1',
  clientName: 'Indústria ABC',
  siteId: 's1',
  siteName: 'Fábrica Sorocaba',
  equipmentId: 'e1',
  equipmentName: 'Gerador GD-001',
  technicianId: 't1',
  technicianName: 'Técnico Demo',
  supervisorId: null,
  supervisorName: null,
  scheduledFor: '2026-11-20T12:00:00Z',
  instructions: null,
  applicableItems: 12,
  startedAtDevice: null,
  startedAtServer: null,
  completedAtDevice: null,
  submittedAtServer: null,
  canceledByName: null,
  canceledAt: null,
  canceledReason: null,
  createdAt: '2026-11-18T12:00:00Z',
  updatedAt: '2026-11-18T12:00:00Z',
}

function event(fields: Partial<InspectionHistoryEvent>): InspectionHistoryEvent {
  return {
    id: 'e1',
    action: 'INSPECTION_CREATED',
    entityType: 'INSPECTION',
    actorId: 'u1',
    actorName: 'Supervisor Demo',
    occurredAt: '2026-11-18T12:00:00Z',
    deviceOccurredAt: null,
    previousStatus: null,
    newStatus: null,
    note: null,
    ...fields,
  }
}

describe('DetailHeader', () => {
  it('mostra a referencia derivada do identificador e o estado', () => {
    render(<DetailHeader inspection={DETAIL} actions={null} />)

    expect(screen.getByRole('heading', { level: 1, name: inspectionReference('d0000000-0000-4000-8000-000000000501') })).toBeInTheDocument()
    expect(screen.getByText('Atribuída')).toBeInTheDocument()
  })
})

describe('PlanningDetails', () => {
  const props = { today: '2026-11-19', editAction: null, lockedReason: null }

  it('distingue inspecao sem tecnico de tecnico que a API nao deixou resolver', () => {
    const { rerender } = render(<PlanningDetails inspection={{ ...DETAIL, technicianId: null, technicianName: null }} {...props} />)
    expect(screen.getByText('Não atribuído')).toBeInTheDocument()

    rerender(<PlanningDetails inspection={{ ...DETAIL, technicianName: null }} {...props} />)
    expect(screen.queryByText('Não atribuído')).not.toBeInTheDocument()
  })

  it('trata a inspecao sem equipamento como inspecao do local', () => {
    render(<PlanningDetails inspection={{ ...DETAIL, equipmentId: null, equipmentName: null }} {...props} />)

    expect(screen.getByText('Inspeção geral do local')).toBeInTheDocument()
  })
})

describe('ExecutionDetails', () => {
  it('informa os itens do checklist e que a execucao nao comecou', () => {
    render(<ExecutionDetails inspection={DETAIL} />)

    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText(/O técnico ainda não iniciou a execução/)).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('nao afirma que o tecnico nao iniciou quando o historico nao tem os horarios', () => {
    render(<ExecutionDetails inspection={{ ...DETAIL, status: 'IN_PROGRESS' }} />)

    expect(screen.getByText('O histórico não registra os horários desta execução.')).toBeInTheDocument()
    expect(screen.queryByText(/ainda não iniciou/)).not.toBeInTheDocument()
  })

  it('mostra dispositivo e servidor lado a lado e avisa quando falta sincronizar (RN-074)', () => {
    render(
      <ExecutionDetails
        inspection={{
          ...DETAIL,
          status: 'IN_PROGRESS',
          startedAtDevice: '2026-11-20T12:00:00Z',
          startedAtServer: '2026-11-20T15:00:00Z',
          completedAtDevice: '2026-11-20T14:00:00Z',
        }}
      />,
    )

    expect(screen.getByRole('table', { name: 'Horários do dispositivo e do servidor' })).toBeInTheDocument()
    expect(screen.getByText('Aguardando sincronização')).toBeInTheDocument()
  })
})

describe('CancellationNotice', () => {
  it('mostra quem cancelou e o motivo, e some em outros estados (RN-029)', () => {
    const canceled = {
      ...DETAIL,
      status: 'CANCELED' as const,
      canceledByName: 'Supervisor Demo',
      canceledAt: '2026-11-19T10:00:00Z',
      canceledReason: 'Cliente pediu reagendamento',
    }
    const { rerender } = render(<CancellationNotice inspection={canceled} />)

    expect(screen.getByText(/Por Supervisor Demo/)).toBeInTheDocument()
    expect(screen.getByText('Cliente pediu reagendamento')).toBeInTheDocument()

    rerender(<CancellationNotice inspection={DETAIL} />)
    expect(screen.queryByText('Inspeção cancelada')).not.toBeInTheDocument()
  })
})

describe('StatusHistory', () => {
  it('lista os eventos com a mudanca de estado, o autor e a hora do dispositivo', () => {
    render(
      <StatusHistory
        inspectionId={DETAIL.id}
        events={[
          event({ action: 'INSPECTION_CREATED', newStatus: 'ASSIGNED' }),
          event({
            id: 'e2',
            action: 'INSPECTION_STARTED',
            actorName: 'Técnico Demo',
            previousStatus: 'ASSIGNED',
            newStatus: 'IN_PROGRESS',
            deviceOccurredAt: '2026-11-20T12:00:00Z',
          }),
          event({ id: 'e3', action: 'INSPECTION_REPORT_EXPORTED', entityType: 'INSPECTION_REPORT', actorName: null, note: 'Formato PDF' }),
        ]}
      />,
    )

    expect(screen.getByText('Técnico iniciou a inspeção')).toBeInTheDocument()
    expect(screen.getByText('Atribuída → Em execução')).toBeInTheDocument()
    expect(screen.getByText(/no dispositivo:/)).toBeInTheDocument()
    expect(screen.getByText(/Sistema ·/)).toBeInTheDocument()
    expect(screen.getByText('Formato PDF')).toBeInTheDocument()
  })

  it('diz que nao ha eventos e leva a auditoria da inspecao', () => {
    render(<StatusHistory inspectionId={DETAIL.id} events={[]} />)

    expect(screen.getByText('Nenhum evento registrado.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver na auditoria' })).toHaveAttribute(
      'href',
      `/audit?period=all&inspectionId=${DETAIL.id}`,
    )
  })
})
