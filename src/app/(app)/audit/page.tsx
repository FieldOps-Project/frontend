import type { Metadata } from 'next'
import Link from 'next/link'
import { MdOutlineFileDownload } from 'react-icons/md'

import { EmptyState } from '@/components/ui/empty-state'
import { Notice } from '@/components/ui/notice'
import { NumberedPagination } from '@/components/ui/numbered-pagination'
import { CARD } from '@/components/ui/styles'
import { isDemoAudit, loadAuditFilterOptions, loadAuditPage } from '@/features/audit/audit-data'
import { auditFilterParams, hasActiveAuditFilters, parseAuditFilters } from '@/features/audit/audit-filters'
import { AuditFiltersBar } from '@/features/audit/audit-filters-bar'
import { AuditTable } from '@/features/audit/audit-table'
import { requireRole } from '@/lib/dal'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { pageParam, withParams } from '@/lib/search-params'

export const metadata: Metadata = {
  title: 'Auditoria — FieldOps',
}

const EXPORT_BUTTON =
  'inline-flex h-12 items-center gap-2 rounded-field border border-neutral-300 bg-neutral-0 px-5 text-base font-semibold text-neutral-900 transition-colors hover:bg-neutral-100'

/**
 * Auditoria de sistema (Stitch "Auditoria de Sistema", documento 10.12.1 e
 * issue #24). Administrador e supervisor consultam (matriz 5.2); os eventos sao
 * somente leitura (RN-088). Filtros e pagina vivem na URL e a paginacao
 * acontece no servidor.
 */
export default async function AuditPage(props: PageProps<'/audit'>) {
  await requireRole(MANAGER_ROLES)
  const searchParams = await props.searchParams
  const filters = parseAuditFilters(searchParams)

  const [page, options] = await Promise.all([loadAuditPage(filters, pageParam(searchParams)), loadAuditFilterOptions()])
  const params = auditFilterParams(filters)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-semibold tracking-tight text-neutral-950">Auditoria de Sistema</h1>
          <p className="text-lg text-neutral-700">Registro centralizado de atividades e alterações no sistema.</p>
        </div>
        <a href={withParams('/audit/export', params)} download className={EXPORT_BUTTON}>
          <MdOutlineFileDownload aria-hidden className="size-5" />
          Exportar Relatório
        </a>
      </header>

      {isDemoAudit() && (
        <Notice tone="warning">
          Dados de demonstração: a API ainda não publica a consulta de auditoria. Os eventos vêm das inspeções, fotos e
          não conformidades de exemplo.
        </Notice>
      )}

      <AuditFiltersBar filters={filters} actors={options.actors} actions={options.actions} />

      {filters.inspectionId && (
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-card border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
          Mostrando só os eventos de uma inspeção.
          <Link href={`/inspections/${filters.inspectionId}`} className="font-medium underline">
            Voltar para a inspeção
          </Link>
          <Link href={withParams('/audit', { ...params, inspectionId: undefined })} className="font-medium underline">
            Ver todos os eventos
          </Link>
        </p>
      )}

      <section aria-label="Eventos" className={`${CARD} @container overflow-hidden`}>
        {page === null ? (
          <EmptyState
            title="Auditoria indisponível"
            description="A API ainda não publica a consulta de auditoria. Tente novamente mais tarde."
          />
        ) : page.totalElements === 0 ? (
          <EmptyState
            title="Nenhum evento encontrado"
            description={
              hasActiveAuditFilters(filters)
                ? 'Ajuste o período ou limpe os filtros para ver mais eventos.'
                : 'Nenhuma atividade registrada nos últimos 7 dias.'
            }
          />
        ) : (
          <>
            <AuditTable events={page.content} />
            <NumberedPagination page={page} pathname="/audit" params={params} noun={['registro', 'registros']} />
          </>
        )}
      </section>
    </div>
  )
}
