import { describe, expect, it } from 'vitest'

import { auditCsv } from '@/features/audit/audit-csv'
import type { AuditEvent } from '@/lib/domain/audit'

const EVENT: AuditEvent = {
  id: 'e1',
  action: 'INSPECTION_REPORT_EXPORTED',
  entityType: 'INSPECTION_REPORT',
  actorId: 'u1',
  actorName: 'Administrador Demo',
  occurredAt: '2026-11-18T17:32:01Z',
  deviceOccurredAt: '2026-11-18T17:30:12Z',
  previousStatus: null,
  newStatus: null,
  note: 'Formato PDF',
  inspectionId: 'd0000000-0000-4000-8000-000000000503',
  inspectionTitle: 'Inspeção após manutenção',
}

function lines(events: readonly AuditEvent[]): string[] {
  return auditCsv(events).slice(1).split('\r\n')
}

describe('auditCsv', () => {
  it('gera o cabecalho e uma linha por evento, com os rotulos da tela', () => {
    const [header, row] = lines([EVENT])

    expect(header).toBe(
      'Data/hora (servidor);Data/hora (dispositivo);Inspeção;Título da inspeção;Usuário;Ação;Registro afetado;Detalhe',
    )
    expect(row).toBe(
      '18/11/2026, 14:32:01;18/11/2026, 14:30:12;INS-00000503;Inspeção após manutenção;Administrador Demo;Relatório exportado;Relatório;Formato PDF',
    )
  })

  it('identifica o sistema e deixa em branco o que nao existe', () => {
    const [, row] = lines([{ ...EVENT, actorName: null, deviceOccurredAt: null, note: null }])
    expect(row).toContain(';;INS-00000503;')
    expect(row?.startsWith('18/11/2026, 14:32:01;;')).toBe(true)
    expect(row).toContain(';Sistema;')
    expect(row?.endsWith(';Relatório;')).toBe(true)
  })

  it('neutraliza texto que a planilha executaria como formula', () => {
    const [, row] = lines([{ ...EVENT, inspectionTitle: '=HYPERLINK("http://x")' }])
    expect(row).toContain(`"'=HYPERLINK(""http://x"")"`)
  })
})
