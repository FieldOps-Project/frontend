import Link from 'next/link'

import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { BUTTON_PRIMARY, CARD } from '@/components/ui/styles'
import { byId, loadClients, loadSites, siteGroups } from '@/features/catalog/lookups'
import { createEquipment } from '@/features/equipment/actions'
import { EquipmentForm } from '@/features/equipment/equipment-form'
import { requireRole } from '@/lib/dal'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { param } from '@/lib/search-params'

export default async function NewEquipmentPage(props: PageProps<'/equipment/new'>) {
  await requireRole(MANAGER_ROLES)
  const [sites, clients, searchParams] = await Promise.all([loadSites('ACTIVE'), loadClients(), props.searchParams])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Novo equipamento" description="O equipamento é criado ativo, vinculado a um local." />
      <section className={`${CARD} p-6`}>
        {sites.length === 0 ? (
          <EmptyState
            title="Nenhum local ativo"
            description="Todo equipamento pertence a um local. Cadastre ou reative um local primeiro."
            action={
              <Link href="/sites/new" className={BUTTON_PRIMARY}>
                Novo local
              </Link>
            }
          />
        ) : (
          <EquipmentForm
            action={createEquipment}
            siteGroups={siteGroups(sites, byId(clients))}
            defaultSiteId={param(searchParams, 'siteId')}
            submitLabel="Criar equipamento"
            cancelHref="/equipment"
          />
        )}
      </section>
    </div>
  )
}
