import { DashboardHeader } from '@/features/dashboard/dashboard-header'
import { loadDashboardSummary, loadRecentNonConformities } from '@/features/dashboard/dashboard-data'
import { DelayedInspectionsCard } from '@/features/dashboard/delayed-inspections-card'
import { EmptyOperation } from '@/features/dashboard/empty-operation'
import { PendingReviewsCard } from '@/features/dashboard/pending-reviews-card'
import { PipelineCard } from '@/features/dashboard/pipeline-card'
import { RecentNonConformities } from '@/features/dashboard/recent-non-conformities'
import { requireRole } from '@/lib/dal'
import { hasNoInspections } from '@/lib/domain/dashboard'
import { MANAGER_ROLES } from '@/lib/domain/user'

/**
 * Dashboard do painel (documento 14.5 e issue #28): inspecoes por estado,
 * aguardando revisao, atrasadas, nao conformidades recentes e os atalhos para
 * revisar pendencias e criar inspecao.
 *
 * Cada numero e link para a listagem com o filtro correspondente, e os recortes
 * sao os mesmos da listagem, para que o numero e a lista nunca divirjam. Sem
 * cache: recarregar depois que o tecnico sincroniza ja mostra o novo estado.
 */
export default async function DashboardPage() {
  await requireRole(MANAGER_ROLES)

  const [summary, recent] = await Promise.all([loadDashboardSummary(), loadRecentNonConformities()])

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <DashboardHeader />

      {summary && hasNoInspections(summary.inspectionsByStatus) && <EmptyOperation />}

      {summary && !hasNoInspections(summary.inspectionsByStatus) && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,24.5rem)]">
          <PipelineCard counts={summary.inspectionsByStatus} />

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1 xl:content-start">
            <PendingReviewsCard count={summary.awaitingReview} />
            <DelayedInspectionsCard summary={summary} />
          </div>
        </div>
      )}

      {recent && <RecentNonConformities items={recent} />}
    </div>
  )
}
