import 'server-only'

import { demoInspectionDetail, demoInspectionHistory } from '@/features/inspections/detail-fixture'
import { paginate } from '@/features/inspections/list-data'
import { demoInspections } from '@/features/inspections/list-fixture'
import { loadOptional } from '@/lib/dal'
import { isAwaitingReview } from '@/lib/domain/inspection-list'
import { DEFAULT_PAGE_SIZE, type Page } from '@/lib/domain/page'
import { byLongestWait, type ReviewQueueItem } from '@/lib/domain/review-queue'

function usesDemo(): boolean {
  return process.env.NEXT_PUBLIC_APP_ENV === 'development'
}

export function isDemoReviewQueue(): boolean {
  return usesDemo()
}

function demoQueue(): ReviewQueueItem[] {
  return demoInspections()
    .filter(isAwaitingReview)
    .flatMap((item) => {
      const detail = demoInspectionDetail(item.id)
      if (!detail?.submittedAtServer || (detail.status !== 'SUBMITTED' && detail.status !== 'UNDER_REVIEW')) return []
      const started = detail.status === 'UNDER_REVIEW'
        ? demoInspectionHistory(item.id)?.findLast((event) => event.action === 'REVIEW_STARTED')
        : undefined
      return [
        {
          id: detail.id,
          code: detail.code,
          title: detail.title,
          clientName: detail.clientName,
          siteName: detail.siteName,
          equipmentName: detail.equipmentName,
          technicianName: detail.technicianName,
          supervisorName: detail.supervisorName,
          priority: detail.priority,
          status: detail.status,
          submittedAtServer: detail.submittedAtServer,
          reviewStartedByName: started?.actorName ?? null,
          reviewStartedAt: started?.occurredAt ?? null,
        },
      ]
    })
    .toSorted(byLongestWait)
}

/**
 * Fila de revisao (issue #21): inspecoes enviadas e em revisao, a que espera ha
 * mais tempo primeiro. O escopo e da API (RN-005): o supervisor recebe as que
 * estao sob sua responsabilidade e o administrador recebe todas, pelo token.
 * Unico ponto de troca para a API; sem ela, devolve `null` e a tela mostra a
 * fila como indisponivel.
 */
export async function loadReviewQueue(page: number, size: number = DEFAULT_PAGE_SIZE): Promise<Page<ReviewQueueItem> | null> {
  if (usesDemo()) {
    return paginate(demoQueue(), page, size)
  }
  return loadOptional<Page<ReviewQueueItem>>('/inspections', {
    review: 'true',
    page,
    size,
    sort: 'submittedAtServer,asc',
  })
}

/** Quantas aguardam revisao, para o atalho da listagem de inspecoes. */
export async function countReviewQueue(): Promise<number | null> {
  const page = await loadReviewQueue(0, 1)
  return page?.totalElements ?? null
}
