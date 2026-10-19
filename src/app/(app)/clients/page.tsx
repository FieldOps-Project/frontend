import Link from 'next/link'
import { IoAddOutline } from 'react-icons/io5'

import { EmptyState } from '@/components/ui/empty-state'
import { FilterBar, FilterSearch, FilterSelect } from '@/components/ui/filter-bar'
import { FlashNotice } from '@/components/ui/notice'
import { PageHeader } from '@/components/ui/page-header'
import { Pagination } from '@/components/ui/pagination'
import { StatusBadge } from '@/components/ui/status-badge'
import { BUTTON_PRIMARY, CARD, LINK } from '@/components/ui/styles'
import { Table, Td } from '@/components/ui/table'
import { load, requireRole } from '@/lib/dal'
import {
  CLIENT_STATUS_LABELS,
  CLIENT_STATUS_TONES,
  CLIENT_STATUSES,
  formatDocument,
  type Client,
} from '@/lib/domain/client'
import { DEFAULT_PAGE_SIZE, type Page } from '@/lib/domain/page'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { formatDateTime, orDash } from '@/lib/format'
import { oneOf, pageParam, param } from '@/lib/search-params'

export default async function ClientsPage(props: PageProps<'/clients'>) {
  await requireRole(MANAGER_ROLES)
  const searchParams = await props.searchParams

  const filters = {
    search: param(searchParams, 'search'),
    status: oneOf(searchParams, 'status', CLIENT_STATUSES),
  }

  const page = await load<Page<Client>>('/clients', {
    ...filters,
    page: pageParam(searchParams),
    size: DEFAULT_PAGE_SIZE,
    sort: 'name,asc',
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clientes"
        description="Organizações atendidas pela operação. Primeiro nível da hierarquia cliente › local › equipamento."
        actions={
          <Link href="/clients/new" className={BUTTON_PRIMARY}>
            <IoAddOutline aria-hidden className="size-4" />
            Novo cliente
          </Link>
        }
      />

      <FlashNotice code={param(searchParams, 'notice')} />

      <section className={CARD}>
        <FilterBar pathname="/clients">
          <FilterSearch label="Buscar" defaultValue={filters.search} placeholder="Nome ou razão social" />
          <FilterSelect
            name="status"
            label="Situação"
            defaultValue={filters.status}
            allLabel="Todas"
            options={CLIENT_STATUSES.map((value) => ({ value, label: CLIENT_STATUS_LABELS[value] }))}
          />
        </FilterBar>

        {page.content.length === 0 ? (
          <EmptyState
            title="Nenhum cliente encontrado"
            description={
              filters.search || filters.status
                ? 'Ajuste os filtros ou limpe a busca.'
                : 'Cadastre o primeiro cliente para depois incluir os locais e equipamentos dele.'
            }
          />
        ) : (
          <Table caption="Clientes" head={['Nome', 'Documento', 'E-mail', 'Telefone', 'Situação', 'Atualizado em', '']}>
            {page.content.map((client) => (
              <tr key={client.id} className="hover:bg-neutral-50">
                <Td>
                  <span className="flex flex-col">
                    <span className="font-medium text-neutral-900">{client.name}</span>
                    {client.legalName && <span className="text-xs text-neutral-500">{client.legalName}</span>}
                  </span>
                </Td>
                <Td className="whitespace-nowrap">{orDash(formatDocument(client.document))}</Td>
                <Td>{orDash(client.email)}</Td>
                <Td className="whitespace-nowrap">{orDash(client.phone)}</Td>
                <Td>
                  <StatusBadge label={CLIENT_STATUS_LABELS[client.status]} tone={CLIENT_STATUS_TONES[client.status]} />
                </Td>
                <Td className="whitespace-nowrap">{formatDateTime(client.updatedAt)}</Td>
                <Td className="whitespace-nowrap">
                  <span className="flex gap-3">
                    <Link href={`/clients/${client.id}/sites`} className={LINK}>
                      Locais
                    </Link>
                    <Link href={`/clients/${client.id}/edit`} className={LINK}>
                      Editar
                    </Link>
                  </span>
                </Td>
              </tr>
            ))}
          </Table>
        )}

        <Pagination page={page} pathname="/clients" params={filters} />
      </section>
    </div>
  )
}
