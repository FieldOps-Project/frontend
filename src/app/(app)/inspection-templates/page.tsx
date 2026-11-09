import Link from 'next/link'
import { IoAddOutline } from 'react-icons/io5'

import { EmptyState } from '@/components/ui/empty-state'
import { FilterBar, FilterSearch, FilterSelect } from '@/components/ui/filter-bar'
import { FlashNotice, Notice } from '@/components/ui/notice'
import { NumberedPagination } from '@/components/ui/numbered-pagination'
import { CARD } from '@/components/ui/styles'
import { Table, Td } from '@/components/ui/table'
import { TemplateStatusBadge } from '@/features/templates/template-status-badge'
import { loadTemplateCategories, loadTemplatePage, usesDemoTemplates } from '@/features/templates/templates-data'
import { requireRole } from '@/lib/dal'
import { TEMPLATE_STATUS_LABELS, TEMPLATE_STATUSES, type TemplateFilters } from '@/lib/domain/inspection-template'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { formatDateTime } from '@/lib/format'
import { oneOf, pageParam, param } from '@/lib/search-params'

/**
 * Modelos de inspecao (issue #13 e documento 14.8): busca, filtro por situacao
 * e por categoria, com a situacao e a versao vigente de cada modelo.
 *
 * Filtros e pagina vivem na URL e a paginacao acontece no servidor.
 */
export default async function InspectionTemplatesPage(props: PageProps<'/inspection-templates'>) {
  await requireRole(MANAGER_ROLES)
  const searchParams = await props.searchParams

  const categories = await loadTemplateCategories()
  const filters: TemplateFilters = {
    search: param(searchParams, 'search'),
    status: oneOf(searchParams, 'status', TEMPLATE_STATUSES),
    category: oneOf(searchParams, 'category', categories),
  }
  const page = await loadTemplatePage(filters, pageParam(searchParams))
  const filtered = Boolean(filters.search || filters.status || filters.category)

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-semibold tracking-tight text-neutral-950">Modelos de Inspeção</h1>
          <p className="text-lg text-neutral-700">Crie e mantenha os checklists que os técnicos usam em campo.</p>
        </div>
        <Link
          href="/inspection-templates/new"
          className="inline-flex h-12 items-center gap-2 rounded-field bg-brand-700 px-5 text-base font-semibold text-neutral-0 transition-colors hover:bg-brand-800"
        >
          <IoAddOutline aria-hidden className="size-6" />
          Novo Modelo
        </Link>
      </header>

      <FlashNotice code={param(searchParams, 'notice')} />

      {usesDemoTemplates() && (
        <Notice tone="warning">
          Dados de demonstração: a API local ainda não tem os modelos de inspeção. O que você criar ou alterar fica
          guardado até o servidor de desenvolvimento reiniciar.
        </Notice>
      )}

      <section aria-label="Modelos" className={`${CARD} overflow-hidden`}>
        <FilterBar pathname="/inspection-templates">
          <FilterSearch label="Buscar" defaultValue={filters.search} placeholder="Título ou descrição" />
          <FilterSelect
            name="status"
            label="Situação"
            defaultValue={filters.status}
            allLabel="Todas"
            options={TEMPLATE_STATUSES.map((value) => ({ value, label: TEMPLATE_STATUS_LABELS[value] }))}
          />
          <FilterSelect
            name="category"
            label="Categoria"
            defaultValue={filters.category}
            allLabel="Todas"
            options={categories.map((value) => ({ value, label: value }))}
          />
        </FilterBar>

        {page.totalElements === 0 ? (
          <EmptyState
            title={filtered ? 'Nenhum modelo encontrado' : 'Nenhum modelo cadastrado'}
            description={
              filtered
                ? 'Ajuste ou limpe os filtros para ver mais resultados.'
                : 'Crie o primeiro modelo para montar o checklist que o técnico vai preencher.'
            }
          />
        ) : (
          <>
            <Table caption="Modelos de inspeção" head={['Modelo', 'Categoria', 'Situação', 'Atualizado em']}>
              {page.content.map((template) => (
                <tr key={template.id} className="hover:bg-neutral-50">
                  <Td>
                    <span className="flex max-w-md flex-col">
                      <Link
                        href={`/inspection-templates/${template.id}/edit`}
                        className="font-medium text-neutral-900 hover:text-brand-700 hover:underline"
                      >
                        {template.title}
                      </Link>
                      {template.description && (
                        <span className="truncate text-xs text-neutral-500">{template.description}</span>
                      )}
                    </span>
                  </Td>
                  <Td>{template.category}</Td>
                  <Td>
                    <TemplateStatusBadge template={template} />
                  </Td>
                  <Td className="whitespace-nowrap">{formatDateTime(template.updatedAt)}</Td>
                </tr>
              ))}
            </Table>
            <NumberedPagination
              page={page}
              pathname="/inspection-templates"
              params={{ search: filters.search, status: filters.status, category: filters.category }}
            />
          </>
        )}
      </section>
    </div>
  )
}
