import type { Metadata } from 'next'

import { AuditScopeNav } from '@/features/audit/audit-scope-nav'
import { parseAuditQuery } from '@/features/audit/audit-filters'
import { InspectionAudit, InspectionSearch, RecentActivityAudit } from '@/features/audit/audit-views'
import { requireRole } from '@/lib/dal'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { pageParam, param } from '@/lib/search-params'

export const metadata: Metadata = {
  title: 'Auditoria — FieldOps',
}

export default async function AuditPage(props: PageProps<'/audit'>) {
  await requireRole(MANAGER_ROLES)
  const searchParams = await props.searchParams
  const query = parseAuditQuery(searchParams)
  const page = pageParam(searchParams)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold tracking-tight text-neutral-950">Auditoria por inspeção</h1>
        <p className="text-lg text-neutral-700">Linha do tempo dos eventos registrados em cada inspeção. Somente leitura.</p>
      </header>

      <AuditScopeNav recent={query.recent && !query.inspectionId} />

      {query.inspectionId ? (
        <InspectionAudit query={query} page={page} inspectionId={query.inspectionId} />
      ) : query.recent ? (
        <RecentActivityAudit query={query} page={page} />
      ) : (
        <InspectionSearch search={param(searchParams, 'search')} page={page} />
      )}
    </div>
  )
}
