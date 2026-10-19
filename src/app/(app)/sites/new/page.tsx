import Link from 'next/link'

import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { BUTTON_PRIMARY, CARD } from '@/components/ui/styles'
import { clientOptions, loadClients } from '@/features/catalog/lookups'
import { createSite } from '@/features/sites/actions'
import { SiteForm } from '@/features/sites/site-form'
import { requireRole } from '@/lib/dal'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { param } from '@/lib/search-params'

export default async function NewSitePage(props: PageProps<'/sites/new'>) {
  await requireRole(MANAGER_ROLES)
  const [clients, searchParams] = await Promise.all([loadClients('ACTIVE'), props.searchParams])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Novo local" description="O local é criado ativo e vinculado a um cliente." />
      <section className={`${CARD} p-6`}>
        {clients.length === 0 ? (
          <EmptyState
            title="Nenhum cliente ativo"
            description="Todo local pertence a um cliente. Cadastre ou reative um cliente primeiro."
            action={
              <Link href="/clients/new" className={BUTTON_PRIMARY}>
                Novo cliente
              </Link>
            }
          />
        ) : (
          <SiteForm
            action={createSite}
            clientOptions={clientOptions(clients)}
            defaultClientId={param(searchParams, 'clientId')}
            submitLabel="Criar local"
          />
        )}
      </section>
    </div>
  )
}
