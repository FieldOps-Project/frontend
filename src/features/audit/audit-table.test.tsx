import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AuditTable } from '@/features/audit/audit-table'
import type { AuditEvent } from '@/lib/domain/audit'

const INSPECTION_ID = 'd0000000-0000-4000-8000-000000000503'

const APPROVAL: AuditEvent = {
  id: 'audit-1',
  action: 'INSPECTION_APPROVED',
  entityType: 'INSPECTION',
  actorId: 'user-joao-silva',
  actorName: 'João Silva',
  occurredAt: '2026-11-18T17:32:01Z',
  deviceOccurredAt: null,
  previousStatus: 'UNDER_REVIEW',
  newStatus: 'APPROVED',
  note: null,
  inspectionId: INSPECTION_ID,
  inspectionTitle: 'Inspeção após manutenção',
}

const SYSTEM: AuditEvent = {
  ...APPROVAL,
  id: 'audit-2',
  action: 'INSPECTION_REPORT_EXPORTED',
  actorId: null,
  actorName: null,
  entityType: 'INSPECTION_REPORT',
  previousStatus: null,
  newStatus: null,
  note: 'Formato PDF',
}

describe('AuditTable', () => {
  it('mostra horario com segundos, usuario, acao traduzida, registro e transicao', () => {
    render(<AuditTable events={[APPROVAL]} showInspection={false} />)
    const table = within(screen.getByRole('table'))

    expect(table.getByText('18/11/2026, 14:32:01')).toBeInTheDocument()
    expect(table.getByText('João Silva')).toBeInTheDocument()
    expect(table.getByText('Supervisor aprovou')).toBeInTheDocument()
    expect(table.getByText('Inspeção')).toBeInTheDocument()
    expect(table.getByText('Em revisão → Aprovada')).toBeInTheDocument()
    expect(table.queryByRole('columnheader', { name: 'Inspeção' })).not.toBeInTheDocument()
  })

  it('mostra o horario do dispositivo quando a acao veio do aplicativo', () => {
    render(<AuditTable events={[{ ...APPROVAL, deviceOccurredAt: '2026-11-18T17:30:12Z' }]} showInspection={false} />)
    expect(within(screen.getByRole('table')).getByText('14:30:12')).toBeInTheDocument()
  })

  it('liga cada evento a auditoria da sua inspecao na atividade recente', () => {
    render(<AuditTable events={[APPROVAL]} showInspection />)
    const table = within(screen.getByRole('table'))

    expect(table.getByRole('columnheader', { name: 'Inspeção' })).toBeInTheDocument()
    expect(table.getByRole('link', { name: /INS-00000503/ })).toHaveAttribute('href', `/audit?inspectionId=${INSPECTION_ID}`)
  })

  it('identifica acao do sistema e a observacao do evento', () => {
    render(<AuditTable events={[SYSTEM]} showInspection={false} />)
    const table = within(screen.getByRole('table'))

    expect(table.getByText('Sistema')).toBeInTheDocument()
    expect(table.getByText('Relatório exportado')).toBeInTheDocument()
    expect(table.getByText('Formato PDF')).toBeInTheDocument()
  })

  it('e somente leitura (RN-088)', () => {
    render(<AuditTable events={[APPROVAL, SYSTEM]} showInspection />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
