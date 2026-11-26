import type { Metadata } from 'next'

import { EmptyState } from '@/components/ui/empty-state'
import { NumberedPagination } from '@/components/ui/numbered-pagination'
import { CARD } from '@/components/ui/styles'
import { filterParams, hasActiveFilters, parseNonConformityFilters } from '@/features/non-conformities/list-filters'
import { loadNonConformityListing } from '@/features/non-conformities/non-conformities-data'
import { NonConformityFilters } from '@/features/non-conformities/non-conformity-filters'
import { NonConformityTable } from '@/features/non-conformities/non-conformity-table'
import { requireRole } from '@/lib/dal'
import { FIELD_FINDINGS_ROLES } from '@/lib/domain/non-conformity'
import { pageParam } from '@/lib/search-params'

export const metadata: Metadata = {
  title: 'Não conformidades — FieldOps',
}

export default async function NonConformitiesPage(props: PageProps<'/non-conformities'>) {
  await requireRole(FIELD_FINDINGS_ROLES)
  const searchParams = await props.searchParams
  const filters = parseNonConformityFilters(searchParams)

  const { page, clients } = await loadNonConformityListing(filters, pageParam(searchParams))
  const filtered = hasActiveFilters(filters)

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold tracking-tight text-neutral-950">Não conformidades</h1>
        <p className="text-lg text-neutral-700">Achados registrados em campo, do mais antigo para o mais recente.</p>
      </header>

      <NonConformityFilters filters={filters} clients={clients} />

      <section aria-label="Resultados" className={`${CARD} overflow-hidden`}>
        {page.totalElements === 0 ? (
          <EmptyState
            title={filtered ? 'Nenhuma não conformidade encontrada' : 'Nenhuma não conformidade registrada'}
            description={
              filtered
                ? 'Ajuste ou limpe os filtros para ver mais resultados.'
                : 'Os achados aparecem aqui quando o técnico sincroniza a inspeção.'
            }
          />
        ) : (
          <>
            <NonConformityTable items={page.content} />
            <NumberedPagination page={page} pathname="/non-conformities" params={filterParams(filters)} />
          </>
        )}
      </section>
    </div>
  )
}
