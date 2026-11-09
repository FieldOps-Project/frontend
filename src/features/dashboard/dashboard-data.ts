import 'server-only'

import { demoDashboardSummary, demoRecentNonConformities } from '@/features/dashboard/dashboard-fixture'
import { loadOptional } from '@/lib/dal'
import {
  RECENT_NON_CONFORMITIES_LIMIT,
  type DashboardSummary,
  type RecentNonConformity,
} from '@/lib/domain/dashboard'
import type { Page } from '@/lib/domain/page'

function usesDemoDashboard(): boolean {
  return process.env.NEXT_PUBLIC_APP_ENV === 'development'
}

/**
 * Indicadores do painel. Com a API, `GET /dashboard/summary` (documento 12.16,
 * backend #36); em desenvolvimento, enquanto o endpoint nao existe, os numeros
 * saem das inspecoes de demonstracao. `null` quando a API ainda nao publica o
 * endpoint.
 */
export async function loadDashboardSummary(): Promise<DashboardSummary | null> {
  if (usesDemoDashboard()) {
    return demoDashboardSummary()
  }
  return loadOptional<DashboardSummary>('/dashboard/summary')
}

/**
 * Nao conformidades mais recentes, pela listagem do documento 12.13 ordenada
 * pelo horario de campo. `null` quando a API ainda nao publica o endpoint.
 */
export async function loadRecentNonConformities(): Promise<readonly RecentNonConformity[] | null> {
  if (usesDemoDashboard()) {
    return demoRecentNonConformities()
  }

  const page = await loadOptional<Page<RecentNonConformity>>('/non-conformities', {
    size: RECENT_NON_CONFORMITIES_LIMIT,
    sort: 'reportedAt,desc',
  })
  return page?.content ?? null
}
