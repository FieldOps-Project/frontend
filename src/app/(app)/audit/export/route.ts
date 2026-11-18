import type { NextRequest } from 'next/server'

import { loadAuditPage } from '@/features/audit/audit-data'
import { parseAuditFilters } from '@/features/audit/audit-filters'
import { toCsv } from '@/features/inspections/export-csv'
import { requireRole } from '@/lib/dal'
import { AUDIT_ENTITY_LABELS, auditActionLabel, type AuditEvent } from '@/lib/domain/audit'
import { dayInSaoPaulo } from '@/lib/domain/inspection-list'
import { MAX_PAGE_SIZE } from '@/lib/domain/page'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { formatDateTimeSeconds } from '@/lib/format'

/** Teto de seguranca: 50 paginas de 100 eventos. */
const MAX_PAGES = 50

const HEADER = ['ID do evento', 'Data/hora (servidor)', 'Data/hora (dispositivo)', 'Usuário', 'Ação', 'Entidade', 'Registro', 'Descrição']

/**
 * "Exportar Relatorio" da auditoria: CSV de todos os eventos que passam pelos
 * filtros da URL, nao so da pagina aberta. Route Handler e ponto de entrada
 * proprio, entao revalida o perfil.
 */
export async function GET(request: NextRequest): Promise<Response> {
  await requireRole(MANAGER_ROLES)

  const filters = parseAuditFilters(Object.fromEntries(request.nextUrl.searchParams.entries()))
  const events: AuditEvent[] = []

  for (let page = 0; page < MAX_PAGES; page++) {
    const result = await loadAuditPage(filters, page, MAX_PAGE_SIZE)
    if (!result) return new Response('Auditoria indisponível.', { status: 503, headers: { 'Cache-Control': 'no-store' } })
    events.push(...result.content)
    if (result.last) break
  }

  const rows = events.map((event) => [
    event.code,
    formatDateTimeSeconds(event.occurredAt),
    event.deviceOccurredAt ? formatDateTimeSeconds(event.deviceOccurredAt) : null,
    event.actorName ?? 'Sistema (Auto)',
    auditActionLabel(event.action),
    AUDIT_ENTITY_LABELS[event.entityType],
    event.entityLabel,
    event.description,
  ])

  const today = dayInSaoPaulo(new Date())
  return new Response(toCsv(HEADER, rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="auditoria-${today}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
