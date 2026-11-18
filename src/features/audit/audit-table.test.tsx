import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AuditTable } from '@/features/audit/audit-table'
import type { AuditEvent } from '@/lib/domain/audit'

const APPROVAL: AuditEvent = {
  id: 'audit-1',
  code: 'EVT-9042',
  action: 'INSPECTION_APPROVED',
  actorId: 'user-joao-silva',
  actorName: 'João Silva',
  entityType: 'INSPECTION',
  entityId: 'c0000000-0000-4000-8000-000000000095',
  entityLabel: 'INSP-2023-001',
  inspectionId: 'c0000000-0000-4000-8000-000000000095',
  occurredAt: '2026-11-18T17:32:01Z',
  deviceOccurredAt: null,
  description: 'Inspeção estrutural da torre alfa',
}

const SYSTEM: AuditEvent = {
  ...APPROVAL,
  id: 'audit-2',
  code: 'EVT-9039',
  action: 'REPORT_GENERATED',
  actorId: null,
  actorName: null,
  entityType: 'REPORT',
  entityId: 'report',
  entityLabel: 'REL-MENSAL',
  inspectionId: null,
}

describe('AuditTable', () => {
  it('mostra evento, horario com segundos, usuario, acao traduzida e entidade com link', () => {
    render(<AuditTable events={[APPROVAL]} />)
    const table = within(screen.getByRole('table'))

    expect(table.getByText('EVT-9042')).toBeInTheDocument()
    expect(table.getByText('18/11/2026, 14:32:01')).toBeInTheDocument()
    expect(table.getByText('João Silva')).toBeInTheDocument()
    expect(table.getByText('Supervisor aprovou')).toBeInTheDocument()
    expect(table.getByRole('link', { name: 'INSP-2023-001' })).toHaveAttribute('href', `/inspections/${APPROVAL.entityId}`)
  })

  it('mostra o horario do dispositivo quando a acao veio do aplicativo', () => {
    render(<AuditTable events={[{ ...APPROVAL, deviceOccurredAt: '2026-11-18T17:30:12Z' }]} />)
    expect(within(screen.getByRole('table')).getByText('14:30:12')).toBeInTheDocument()
  })

  it('identifica acao do sistema e entidade sem pagina', () => {
    render(<AuditTable events={[SYSTEM]} />)
    const table = within(screen.getByRole('table'))

    expect(table.getByText('Sistema (Auto)')).toBeInTheDocument()
    expect(table.queryByRole('link', { name: 'REL-MENSAL' })).not.toBeInTheDocument()
  })

  it('e somente leitura (RN-088)', () => {
    render(<AuditTable events={[APPROVAL, SYSTEM]} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
