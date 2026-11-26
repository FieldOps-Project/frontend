import 'server-only'

import { paginate } from '@/features/inspections/list-data'
import { isApiError } from '@/lib/api/errors'
import { load } from '@/lib/dal'
import type { InspectionListItem } from '@/lib/domain/inspection-list'
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, type Page } from '@/lib/domain/page'
import {
  byLongestWait,
  REVIEW_QUEUE_STATUSES,
  type ReviewQueueItem,
  type ReviewQueueStatus,
} from '@/lib/domain/review-queue'

function loadByStatus(status: ReviewQueueStatus, size: number): Promise<Page<InspectionListItem>> {
  return load<Page<InspectionListItem>>('/inspections', { status, page: 0, size })
}

export async function loadReviewQueue(page: number, size: number = DEFAULT_PAGE_SIZE): Promise<Page<ReviewQueueItem>> {
  const pages = await Promise.all(REVIEW_QUEUE_STATUSES.map((status) => loadByStatus(status, MAX_PAGE_SIZE)))
  const items = pages.flatMap((result) => result.content as readonly ReviewQueueItem[]).toSorted(byLongestWait)
  return paginate(items, page, size)
}

export async function countReviewQueue(): Promise<number | null> {
  try {
    const pages = await Promise.all(REVIEW_QUEUE_STATUSES.map((status) => loadByStatus(status, 1)))
    return pages.reduce((total, result) => total + result.totalElements, 0)
  } catch (error) {
    if (isApiError(error)) return null
    throw error
  }
}
