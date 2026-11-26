import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AuditExportButton } from '@/features/audit/audit-export-button'
import type { AuditEvent } from '@/lib/domain/audit'

const EVENT: AuditEvent = {
  id: 'e1',
  action: 'INSPECTION_APPROVED',
  entityType: 'INSPECTION',
  actorId: 'u1',
  actorName: 'Ana Souza',
  occurredAt: '2026-11-18T17:32:01Z',
  deviceOccurredAt: null,
  previousStatus: null,
  newStatus: null,
  note: null,
  inspectionId: 'd0000000-0000-4000-8000-000000000503',
  inspectionTitle: 'Inspeção',
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AuditExportButton', () => {
  it('baixa o CSV da linha do tempo com o nome pedido', async () => {
    const createObjectURL = vi.fn(() => 'blob:csv')
    const revokeObjectURL = vi.fn()
    Object.assign(URL, { createObjectURL, revokeObjectURL })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe('auditoria-INS-00000503.csv')
      expect(this.href).toBe('blob:csv')
    })

    render(<AuditExportButton events={[EVENT]} filename="auditoria-INS-00000503.csv" />)
    fireEvent.click(screen.getByRole('button', { name: 'Exportar CSV' }))

    expect(click).toHaveBeenCalledOnce()
    const blob = (createObjectURL.mock.calls[0] as unknown as [Blob])[0]
    expect(await blob.text()).toContain('Supervisor aprovou')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:csv')
  })

  it('fica desabilitado sem eventos', () => {
    render(<AuditExportButton events={[]} filename="auditoria.csv" />)
    expect(screen.getByRole('button', { name: 'Exportar CSV' })).toBeDisabled()
  })
})
