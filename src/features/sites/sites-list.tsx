import Link from 'next/link'

import { EmptyState } from '@/components/ui/empty-state'
import { FilterBar, FilterSearch, FilterSelect } from '@/components/ui/filter-bar'
import { Pagination } from '@/components/ui/pagination'
import { StatusBadge } from '@/components/ui/status-badge'
import { CARD, LINK } from '@/components/ui/styles'
import { Table, Td } from '@/components/ui/table'
import { byId, loadClients } from '@/features/catalog/lookups'
import { load } from '@/lib/dal'
import { DEFAULT_PAGE_SIZE, type Page } from '@/lib/domain/page'
import { SITE_STATUS_LABELS, SITE_STATUS_TONES, SITE_STATUSES, type Site } from '@/lib/domain/site'
import { formatDateTime, orDash } from '@/lib/format'
import { oneOf, pageParam, param, type RawSearchParams } from '@/lib/search-params'

/**
 * Listagem de locais, servida em `/sites` e em `/clients/[id]/sites`. A rota
 * aninhada e a mesma tela com o filtro de cliente fixado pela URL.
 */
export async function SitesList({
  searchParams,
  pathname,
  clientId,
}: {
  searchParams: RawSearchParams
  pathname: string
  clientId?: string
}) {
  const filters = {
    search: param(searchParams, 'search'),
    status: oneOf(searchParams, 'status', SITE_STATUSES),
    clientId: clientId ? undefined : param(searchParams, 'clientId'),
  }

  const [page, clients] = await Promise.all([
    load<Page<Site>>(clientId ? `/clients/${clientId}/sites` : '/sites', {
      ...filters,
      page: pageParam(searchParams),
      size: DEFAULT_PAGE_SIZE,
      sort: 'name,asc',
    }),
    loadClients(),
  ])
  const clientsById = byId(clients)

  return (
    <section className={CARD}>
      <FilterBar pathname={pathname}>
        <FilterSearch label="Buscar" defaultValue={filters.search} placeholder="Nome do local" />
        {!clientId && (
          <FilterSelect
            name="clientId"
            label="Cliente"
            defaultValue={filters.clientId}
            options={clients.map((client) => ({ value: client.id, label: client.name }))}
          />
        )}
        <FilterSelect
          name="status"
          label="Situação"
          defaultValue={filters.status}
          allLabel="Todas"
          options={SITE_STATUSES.map((value) => ({ value, label: SITE_STATUS_LABELS[value] }))}
        />
      </FilterBar>

      {page.content.length === 0 ? (
        <EmptyState
          title="Nenhum local encontrado"
          description={
            filters.search || filters.status || filters.clientId
              ? 'Ajuste os filtros ou limpe a busca.'
              : 'Cadastre um local para depois incluir os equipamentos dele.'
          }
        />
      ) : (
        <Table caption="Locais" head={['Local', 'Cliente', 'Cidade', 'Contato', 'Situação', 'Atualizado em', '']}>
          {page.content.map((site) => (
            <tr key={site.id} className="hover:bg-neutral-50">
              <Td>
                <span className="flex flex-col">
                  <span className="font-medium text-neutral-900">{site.name}</span>
                  {site.addressLine && <span className="text-xs text-neutral-500">{site.addressLine}</span>}
                </span>
              </Td>
              <Td>{orDash(clientsById.get(site.clientId)?.name)}</Td>
              <Td className="whitespace-nowrap">{orDash([site.city, site.state].filter(Boolean).join(' / '))}</Td>
              <Td>{orDash(site.contactName)}</Td>
              <Td>
                <StatusBadge label={SITE_STATUS_LABELS[site.status]} tone={SITE_STATUS_TONES[site.status]} />
              </Td>
              <Td className="whitespace-nowrap">{formatDateTime(site.updatedAt)}</Td>
              <Td className="whitespace-nowrap">
                <span className="flex gap-3">
                  <Link href={`/sites/${site.id}/equipment`} className={LINK}>
                    Equipamentos
                  </Link>
                  <Link href={`/sites/${site.id}/edit`} className={LINK}>
                    Editar
                  </Link>
                </span>
              </Td>
            </tr>
          ))}
        </Table>
      )}

      <Pagination page={page} pathname={pathname} params={filters} />
    </section>
  )
}
