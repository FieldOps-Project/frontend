import Link from 'next/link'

import { Notice } from '@/components/ui/notice'
import { StatusBadge } from '@/components/ui/status-badge'
import { CARD, LINK } from '@/components/ui/styles'
import {
  loadInspectionChoices,
  loadInspectionTimeline,
  loadRecentActivity,
  RECENT_ACTIVITY_INSPECTIONS,
} from '@/features/audit/audit-data'
import { auditTargetParams, type AuditQuery } from '@/features/audit/audit-filters'
import { AuditTimeline } from '@/features/audit/audit-timeline'
import { InspectionPicker } from '@/features/audit/inspection-picker'
import { INSPECTION_STATUS_LABELS, INSPECTION_STATUS_TONES, inspectionReference } from '@/lib/domain/inspection'
import { dayInSaoPaulo } from '@/lib/domain/inspection-list'

type ViewProps = { query: AuditQuery; page: number }

export async function InspectionAudit({ query, page, inspectionId }: ViewProps & { inspectionId: string }) {
  const { inspection, events } = await loadInspectionTimeline(inspectionId)
  const reference = inspectionReference(inspection.id)

  return (
    <>
      <div className={`${CARD} flex flex-wrap items-center justify-between gap-3 px-5 py-4`}>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-lg font-semibold text-neutral-950">
            {reference} · {inspection.title}
          </span>
          <span>
            <StatusBadge label={INSPECTION_STATUS_LABELS[inspection.status]} tone={INSPECTION_STATUS_TONES[inspection.status]} />
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Link href={`/inspections/${inspection.id}`} className={LINK}>
            Abrir inspeção
          </Link>
          <Link href="/audit" className={LINK}>
            Escolher outra inspeção
          </Link>
        </div>
      </div>
      <AuditTimeline
        events={events}
        filters={query.filters}
        page={page}
        baseParams={auditTargetParams(query)}
        showInspection={false}
        exportName={`auditoria-${reference}.csv`}
        emptyDescription="Os eventos aparecem à medida que a inspeção é planejada, executada e revisada."
      />
    </>
  )
}

export async function RecentActivityAudit({ query, page }: ViewProps) {
  const { events, inspections } = await loadRecentActivity()

  return (
    <>
      <Notice>
        Eventos das {inspections} inspeções atualizadas mais recentemente (limite de {RECENT_ACTIVITY_INSPECTIONS}). Para o histórico
        completo, escolha uma inspeção.
      </Notice>
      <AuditTimeline
        events={events}
        filters={query.filters}
        page={page}
        baseParams={auditTargetParams(query)}
        showInspection
        exportName={`auditoria-atividade-recente-${dayInSaoPaulo(new Date())}.csv`}
        emptyDescription="As inspeções mais recentes ainda não têm eventos registrados."
      />
    </>
  )
}

export async function InspectionSearch({ search, page }: { search: string | undefined; page: number }) {
  return <InspectionPicker page={await loadInspectionChoices(search, page)} search={search} />
}
