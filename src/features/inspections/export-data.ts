import 'server-only'

import { apiFilterQuery } from '@/features/inspections/list-filters'
import { buildUrl } from '@/lib/api/client'
import { ApiError, NETWORK_ERROR_CODE, toApiError } from '@/lib/api/errors'
import type { InspectionFilters } from '@/lib/domain/inspection-list'

export async function fetchInspectionsCsv(token: string, filters: InspectionFilters): Promise<Response> {
  const url = buildUrl('/inspections/export.csv', { ...apiFilterQuery(filters), sort: 'scheduledFor,asc' })

  let response: Response
  try {
    response = await fetch(url, { headers: { Accept: 'text/csv', Authorization: `Bearer ${token}` }, cache: 'no-store' })
  } catch {
    throw new ApiError({ status: 0, code: NETWORK_ERROR_CODE, message: 'API unreachable' })
  }

  if (!response.ok) {
    throw await toApiError(response)
  }

  return response
}
