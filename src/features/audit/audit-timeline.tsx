import { EmptyState } from '@/components/ui/empty-state'
import { NumberedPagination } from '@/components/ui/numbered-pagination'
import { CARD } from '@/components/ui/styles'
import { AuditExportButton } from '@/features/audit/audit-export-button'
import { auditFilterParams, hasActiveAuditFilters, type UrlParams } from '@/features/audit/audit-filters'
import { AuditFiltersBar } from '@/features/audit/audit-filters-bar'
import { AuditTable } from '@/features/audit/audit-table'
import {
  auditActionOptions,
  auditActorOptions,
  auditEntityOptions,
  filterAuditEvents,
  paginateEvents,
  type AuditEvent,
  type AuditFilters,
} from '@/lib/domain/audit'
import { dayInSaoPaulo } from '@/lib/domain/inspection-list'
import { DEFAULT_PAGE_SIZE } from '@/lib/domain/page'

export function AuditTimeline({
  events,
  filters,
  page,
  baseParams,
  showInspection,
  exportName,
  emptyDescription,
}: {
  events: readonly AuditEvent[]
  filters: AuditFilters
  page: number
  baseParams: UrlParams
  showInspection: boolean
  exportName: string
  emptyDescription: string
}) {
  const visible = filterAuditEvents(events, filters, dayInSaoPaulo(new Date()))
  const current = paginateEvents(visible, page, DEFAULT_PAGE_SIZE)

  return (
    <>
      <AuditFiltersBar
        filters={filters}
        baseParams={baseParams}
        actors={auditActorOptions(events)}
        entities={auditEntityOptions(events)}
        actions={auditActionOptions(events)}
      />
      <div className="flex justify-end">
        <AuditExportButton events={visible} filename={exportName} />
      </div>
      <section aria-label="Eventos" className={`${CARD} overflow-hidden`}>
        {events.length === 0 ? (
          <EmptyState title="Nenhum evento registrado" description={emptyDescription} />
        ) : visible.length === 0 ? (
          <EmptyState
            title="Nenhum evento encontrado"
            description={hasActiveAuditFilters(filters) ? 'Ajuste o período ou limpe os filtros para ver mais eventos.' : emptyDescription}
          />
        ) : (
          <>
            <AuditTable events={current.content} showInspection={showInspection} />
            <NumberedPagination
              page={current}
              pathname="/audit"
              params={{ ...baseParams, ...auditFilterParams(filters) }}
              noun={['evento', 'eventos']}
            />
          </>
        )}
      </section>
    </>
  )
}
