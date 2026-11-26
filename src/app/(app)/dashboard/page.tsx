import { DashboardHeader } from '@/features/dashboard/dashboard-header'
import { loadDashboardSummary } from '@/features/dashboard/dashboard-data'
import { DelayedInspectionsCard } from '@/features/dashboard/delayed-inspections-card'
import { EmptyOperation } from '@/features/dashboard/empty-operation'
import { PendingReviewsCard } from '@/features/dashboard/pending-reviews-card'
import { PipelineCard } from '@/features/dashboard/pipeline-card'
import { SeverityBreakdownCard } from '@/features/dashboard/severity-breakdown-card'
import { requireRole } from '@/lib/dal'
import { hasNoInspections, REVIEW_SHORTCUT_ROLES } from '@/lib/domain/dashboard'
import { FIELD_FINDINGS_ROLES } from '@/lib/domain/non-conformity'
import { MANAGER_ROLES } from '@/lib/domain/user'

export default async function DashboardPage() {
  const user = await requireRole(MANAGER_ROLES)
  const summary = await loadDashboardSummary()
  const canReview = REVIEW_SHORTCUT_ROLES.includes(user.role)

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <DashboardHeader canReview={canReview} />

      {hasNoInspections(summary.inspectionsByStatus) ? (
        <EmptyOperation />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,24.5rem)]">
          <PipelineCard counts={summary.inspectionsByStatus} />

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1 xl:grid-rows-2">
            <PendingReviewsCard count={summary.awaitingReview} reviewable={canReview} />
            <DelayedInspectionsCard count={summary.overdue} />
          </div>
        </div>
      )}

      <SeverityBreakdownCard
        counts={summary.nonConformitiesBySeverity}
        linkable={FIELD_FINDINGS_ROLES.includes(user.role)}
      />
    </div>
  )
}
