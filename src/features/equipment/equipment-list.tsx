import Link from 'next/link'

import { EmptyState } from '@/components/ui/empty-state'
import { FilterBar, FilterSearch, FilterSelect } from '@/components/ui/filter-bar'
import { Pagination } from '@/components/ui/pagination'
import { StatusBadge } from '@/components/ui/status-badge'
import { CARD, LINK } from '@/components/ui/styles'
import { Table, Td } from '@/components/ui/table'
import { byId, loadClients, loadSites } from '@/features/catalog/lookups'
import { load } from '@/lib/dal'
import {
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_STATUS_TONES,
  EQUIPMENT_STATUSES,
  type Equipment,
} from '@/lib/domain/equipment'
import { DEFAULT_PAGE_SIZE, type Page } from '@/lib/domain/page'
import { formatDate, orDash } from '@/lib/format'
import { oneOf, pageParam, param, type RawSearchParams } from '@/lib/search-params'

/** Listagem de equipamentos, servida em `/equipment` e em `/sites/[id]/equipment`. */
export async function EquipmentList({
  searchParams,
  pathname,
  siteId,
}: {
  searchParams: RawSearchParams
  pathname: string
  siteId?: string
}) {
  const filters = {
    search: param(searchParams, 'search'),
    status: oneOf(searchParams, 'status', EQUIPMENT_STATUSES),
    siteId: siteId ? undefined : param(searchParams, 'siteId'),
  }

  const [page, sites, clients] = await Promise.all([
    load<Page<Equipment>>(siteId ? `/sites/${siteId}/equipment` : '/equipment', {
      ...filters,
      page: pageParam(searchParams),
      size: DEFAULT_PAGE_SIZE,
      sort: 'name,asc',
    }),
    loadSites(),
    loadClients(),
  ])
  const sitesById = byId(sites)
  const clientsById = byId(clients)

  return (
    <section className={CARD}>
      <FilterBar pathname={pathname}>
        <FilterSearch label="Buscar" defaultValue={filters.search} placeholder="Nome, patrimônio, série ou QR" />
        {!siteId && (
          <FilterSelect
            name="siteId"
            label="Local"
            defaultValue={filters.siteId}
            options={sites.map((site) => ({
              value: site.id,
              label: `${site.name} (${clientsById.get(site.clientId)?.name ?? '—'})`,
            }))}
          />
        )}
        <FilterSelect
          name="status"
          label="Situação"
          defaultValue={filters.status}
          allLabel="Todas"
          options={EQUIPMENT_STATUSES.map((value) => ({ value, label: EQUIPMENT_STATUS_LABELS[value] }))}
        />
      </FilterBar>

      {page.content.length === 0 ? (
        <EmptyState
          title="Nenhum equipamento encontrado"
          description={
            filters.search || filters.status || filters.siteId
              ? 'Ajuste os filtros ou limpe a busca.'
              : 'Cadastre um equipamento para gerar a etiqueta de QR Code.'
          }
        />
      ) : (
        <Table caption="Equipamentos" head={['Equipamento', 'Local', 'Patrimônio', 'QR Code', 'Instalação', 'Situação', '']}>
          {page.content.map((equipment) => {
            const site = sitesById.get(equipment.siteId)
            return (
              <tr key={equipment.id} className="hover:bg-neutral-50">
                <Td>
                  <span className="flex flex-col">
                    <Link href={`/equipment/${equipment.id}`} className="font-medium text-neutral-900 hover:underline">
                      {equipment.name}
                    </Link>
                    <span className="text-xs text-neutral-500">
                      {[equipment.manufacturer, equipment.model].filter(Boolean).join(' · ') || '—'}
                    </span>
                  </span>
                </Td>
                <Td>
                  <span className="flex flex-col">
                    <span>{orDash(site?.name)}</span>
                    <span className="text-xs text-neutral-500">{orDash(site && clientsById.get(site.clientId)?.name)}</span>
                  </span>
                </Td>
                <Td className="whitespace-nowrap">{orDash(equipment.assetNumber)}</Td>
                <Td className="font-mono text-xs whitespace-nowrap">{equipment.qrCode}</Td>
                <Td className="whitespace-nowrap">{formatDate(equipment.installedAt)}</Td>
                <Td>
                  <StatusBadge
                    label={EQUIPMENT_STATUS_LABELS[equipment.status]}
                    tone={EQUIPMENT_STATUS_TONES[equipment.status]}
                  />
                </Td>
                <Td className="whitespace-nowrap">
                  <span className="flex gap-3">
                    <Link href={`/equipment/${equipment.id}`} className={LINK}>
                      Detalhe
                    </Link>
                    <Link href={`/equipment/${equipment.id}/edit`} className={LINK}>
                      Editar
                    </Link>
                  </span>
                </Td>
              </tr>
            )
          })}
        </Table>
      )}

      <Pagination page={page} pathname={pathname} params={filters} />
    </section>
  )
}
