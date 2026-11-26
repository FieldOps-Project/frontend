import type { NextRequest } from 'next/server'

import { fetchInspectionsCsv } from '@/features/inspections/export-data'
import { parseInspectionFilters } from '@/features/inspections/list-filters'
import { requireRole } from '@/lib/dal'
import { isApiError } from '@/lib/api/errors'
import { dayInSaoPaulo } from '@/lib/domain/inspection-list'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { getAccessToken } from '@/lib/session'

function failure(status: number): Response {
  return new Response(null, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function GET(request: NextRequest): Promise<Response> {
  await requireRole(MANAGER_ROLES)

  const token = await getAccessToken()
  if (!token) return failure(401)

  const filters = parseInspectionFilters(Object.fromEntries(request.nextUrl.searchParams.entries()))

  try {
    const file = await fetchInspectionsCsv(token, filters)
    return new Response(file.body, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="inspecoes-${dayInSaoPaulo(new Date())}.csv"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    if (isApiError(error) && [401, 403].includes(error.status)) return failure(error.status)
    if (isApiError(error)) return failure(502)
    throw error
  }
}
