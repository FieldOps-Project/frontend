import 'server-only'

import { load } from '@/lib/dal'
import { toDashboardSummary, type DashboardSummary, type DashboardSummaryRecord } from '@/lib/domain/dashboard'

export async function loadDashboardSummary(): Promise<DashboardSummary> {
  return toDashboardSummary(await load<DashboardSummaryRecord>('/dashboard/summary'))
}
