import { toCsv } from '@/features/inspections/export-csv'
import { auditEntityLabel, auditEventDetail, type AuditEvent } from '@/lib/domain/audit'
import { historyActionLabel } from '@/lib/domain/inspection-detail'
import { inspectionReference } from '@/lib/domain/inspection'
import { formatDateTimeSeconds } from '@/lib/format'

const HEADER = [
  'Data/hora (servidor)',
  'Data/hora (dispositivo)',
  'Inspeção',
  'Título da inspeção',
  'Usuário',
  'Ação',
  'Registro afetado',
  'Detalhe',
]

export function auditCsv(events: readonly AuditEvent[]): string {
  return toCsv(
    HEADER,
    events.map((event) => [
      formatDateTimeSeconds(event.occurredAt),
      event.deviceOccurredAt ? formatDateTimeSeconds(event.deviceOccurredAt) : null,
      inspectionReference(event.inspectionId),
      event.inspectionTitle,
      event.actorName ?? 'Sistema',
      historyActionLabel(event.action),
      auditEntityLabel(event.entityType),
      auditEventDetail(event),
    ]),
  )
}
