import 'server-only'

import { loadInspectionHistory, loadInspectionRecord } from '@/features/inspections/detail-data'
import { load } from '@/lib/dal'
import { mergeAuditEvents, toAuditEvents, type AuditEvent } from '@/lib/domain/audit'
import type { InspectionRecord } from '@/lib/domain/inspection-detail'
import type { InspectionListItem } from '@/lib/domain/inspection-list'
import type { Page } from '@/lib/domain/page'

export const RECENT_ACTIVITY_INSPECTIONS = 25
export const PICKER_PAGE_SIZE = 10

export type InspectionTimeline = {
  readonly inspection: InspectionRecord
  readonly events: readonly AuditEvent[]
}

export type RecentActivity = {
  readonly inspections: number
  readonly events: readonly AuditEvent[]
}

export async function loadInspectionTimeline(inspectionId: string): Promise<InspectionTimeline> {
  const [inspection, history] = await Promise.all([loadInspectionRecord(inspectionId), loadInspectionHistory(inspectionId)])
  return { inspection, events: toAuditEvents(inspection, history) }
}

export function loadInspectionChoices(search: string | undefined, page: number): Promise<Page<InspectionListItem>> {
  return load<Page<InspectionListItem>>('/inspections', {
    search,
    page,
    size: PICKER_PAGE_SIZE,
    sort: 'updatedAt,desc',
  })
}

export async function loadRecentActivity(): Promise<RecentActivity> {
  const { content } = await load<Page<InspectionListItem>>('/inspections', {
    size: RECENT_ACTIVITY_INSPECTIONS,
    sort: 'updatedAt,desc',
  })
  const histories = await Promise.all(content.map(async (item) => toAuditEvents(item, await loadInspectionHistory(item.id))))
  return { inspections: content.length, events: mergeAuditEvents(histories) }
}
