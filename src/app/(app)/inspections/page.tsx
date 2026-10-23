import Link from 'next/link'
import { IoAddOutline, IoDownloadOutline } from 'react-icons/io5'

import { EmptyState } from '@/components/ui/empty-state'
import { FlashNotice, Notice } from '@/components/ui/notice'
import { NumberedPagination } from '@/components/ui/numbered-pagination'
import { CARD } from '@/components/ui/styles'
import { InspectionFilters } from '@/features/inspections/inspection-filters'
import { InspectionTable } from '@/features/inspections/inspection-table'
import { loadInspectionFilterOptions, loadInspectionPage } from '@/features/inspections/list-data'
import { filterParams, hasActiveFilters, parseInspectionFilters } from '@/features/inspections/list-filters'
import { requireRole } from '@/lib/dal'
import { dayInSaoPaulo } from '@/lib/domain/inspection-list'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { pageParam, param, withParams } from '@/lib/search-params'

const OUTLINE =
  'inline-flex h-12 items-center gap-2 rounded-field border border-neutral-300 bg-neutral-0 px-5 text-base font-medium text-neutral-900 transition-colors hover:bg-neutral-100'

const PRIMARY =
  'inline-flex h-12 items-center gap-2 rounded-field bg-brand-700 px-5 text-base font-semibold text-neutral-0 transition-colors hover:bg-brand-800'

/**
 * Acompanhamento de inspecoes (issue #17 e documento 14.10).
 *
 * Filtros e pagina vivem na URL e a paginacao acontece no servidor. Sem cache:
 * recarregar depois que o tecnico sincroniza ja mostra o novo estado.
 */
export default async function InspectionsPage(props: PageProps<'/inspections'>) {
  await requireRole(MANAGER_ROLES)
  const searchParams = await props.searchParams
  const filters = parseInspectionFilters(searchParams)

  const [page, options] = await Promise.all([
    loadInspectionPage(filters, pageParam(searchParams)),
    loadInspectionFilterOptions(),
  ])
  const filtered = hasActiveFilters(filters)

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-semibold tracking-tight text-neutral-950">Inspeções</h1>
          <p className="text-lg text-neutral-700">Gerencie e acompanhe todas as inspeções de campo.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href={withParams('/inspections/export', filterParams(filters))} download className={OUTLINE}>
            <IoDownloadOutline aria-hidden className="size-5" />
            Exportar
          </a>
          <Link href="/inspections/new" className={PRIMARY}>
            <IoAddOutline aria-hidden className="size-6" />
            Nova Inspeção
          </Link>
        </div>
      </header>

      <FlashNotice code={param(searchParams, 'notice')} />

      {process.env.NEXT_PUBLIC_APP_ENV === 'development' && (
        <Notice tone="warning">
          Dados de demonstração: a API ainda não publica a listagem paginada de inspeções. Filtros, atraso, progresso e
          paginação já funcionam sobre estas inspeções de exemplo.
        </Notice>
      )}

      <InspectionFilters
        pathname="/inspections"
        filters={filters}
        technicians={options.technicians}
        clients={options.clients}
      />

      <section aria-label="Resultados" className={`${CARD} overflow-hidden`}>
        {page.totalElements === 0 ? (
          <EmptyState
            title={filtered ? 'Nenhuma inspeção encontrada' : 'Nenhuma inspeção'}
            description={
              filtered ? 'Ajuste ou limpe os filtros para ver mais resultados.' : 'Crie a primeira em "Nova Inspeção".'
            }
          />
        ) : (
          <>
            <InspectionTable items={page.content} today={dayInSaoPaulo(new Date())} />
            <NumberedPagination page={page} pathname="/inspections" params={filterParams(filters)} />
          </>
        )}
      </section>
    </div>
  )
}
