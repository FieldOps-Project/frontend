import type { NextRequest } from 'next/server'

import { inspectionsToCsv } from '@/features/inspections/export-csv'
import { loadInspectionPage } from '@/features/inspections/list-data'
import { parseInspectionFilters } from '@/features/inspections/list-filters'
import { requireRole } from '@/lib/dal'
import { dayInSaoPaulo, type InspectionListItem } from '@/lib/domain/inspection-list'
import { MAX_PAGE_SIZE } from '@/lib/domain/page'
import { MANAGER_ROLES } from '@/lib/domain/user'

/** Teto de seguranca: 50 paginas de 100 inspecoes. */
const MAX_PAGES = 50

/**
 * CSV de todas as inspecoes que passam pelos filtros da URL, nao so da pagina
 * aberta. Route Handler e ponto de entrada proprio, entao revalida o perfil.
 */
export async function GET(request: NextRequest): Promise<Response> {
  await requireRole(MANAGER_ROLES)

  const params = Object.fromEntries(request.nextUrl.searchParams.entries())
  const filters = parseInspectionFilters(params)
  const items: InspectionListItem[] = []

  for (let page = 0; page < MAX_PAGES; page++) {
    const result = await loadInspectionPage(filters, page, MAX_PAGE_SIZE)
    items.push(...result.content)
    if (result.last) break
  }

  const today = dayInSaoPaulo(new Date())
  return new Response(inspectionsToCsv(items, today), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="inspecoes-${today}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
