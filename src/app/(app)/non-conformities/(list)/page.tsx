import type { Metadata } from 'next'

import { EmptyState } from '@/components/ui/empty-state'
import { Notice } from '@/components/ui/notice'
import { NumberedPagination } from '@/components/ui/numbered-pagination'
import { CARD } from '@/components/ui/styles'
import { filterParams, hasActiveFilters, parseNonConformityFilters } from '@/features/non-conformities/list-filters'
import { loadClientOptions, loadNonConformityPage } from '@/features/non-conformities/non-conformities-data'
import { NonConformityFilters } from '@/features/non-conformities/non-conformity-filters'
import { NonConformityTable } from '@/features/non-conformities/non-conformity-table'
import { requireRole } from '@/lib/dal'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { pageParam } from '@/lib/search-params'

export const metadata: Metadata = {
  title: 'Não conformidades — FieldOps',
}

/**
 * Nao conformidades de todas as inspecoes (documento 14.12, issue #20).
 *
 * No MVP elas sao registradas e consultadas, nao tratadas: a tela nao oferece
 * mudanca de estado, que a API nao suporta. Filtros e pagina vivem na URL e a
 * paginacao acontece no servidor.
 */
export default async function NonConformitiesPage(props: PageProps<'/non-conformities'>) {
  await requireRole(MANAGER_ROLES)
  const searchParams = await props.searchParams
  const filters = parseNonConformityFilters(searchParams)

  const [page, clients] = await Promise.all([
    loadNonConformityPage(filters, pageParam(searchParams)),
    loadClientOptions(),
  ])
  const filtered = hasActiveFilters(filters)

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold tracking-tight text-neutral-950">Não conformidades</h1>
        <p className="text-lg text-neutral-700">Achados registrados em campo, do mais grave para o menos grave.</p>
      </header>

      {process.env.NEXT_PUBLIC_APP_ENV === 'development' && (
        <Notice tone="warning">
          Dados de demonstração: a API ainda não publica as não conformidades. Filtros, ordem e paginação já funcionam
          sobre estes exemplos.
        </Notice>
      )}

      <NonConformityFilters filters={filters} clients={clients} />

      <section aria-label="Resultados" className={`${CARD} overflow-hidden`}>
        {page === null ? (
          <EmptyState
            title="Não conformidades indisponíveis"
            description="A API ainda não publica a consulta de não conformidades. Tente novamente mais tarde."
          />
        ) : page.totalElements === 0 ? (
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
