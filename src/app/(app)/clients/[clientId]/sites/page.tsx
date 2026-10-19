import Link from 'next/link'
import { notFound } from 'next/navigation'
import { IoAddOutline } from 'react-icons/io5'

import { PageHeader } from '@/components/ui/page-header'
import { BUTTON_PRIMARY } from '@/components/ui/styles'
import { SitesList } from '@/features/sites/sites-list'
import { load, requireRole } from '@/lib/dal'
import type { Client } from '@/lib/domain/client'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { isId } from '@/lib/ids'

export default async function ClientSitesPage(props: PageProps<'/clients/[clientId]/sites'>) {
  await requireRole(MANAGER_ROLES)
  const { clientId } = await props.params
  if (!isId(clientId)) notFound()

  const [client, searchParams] = await Promise.all([load<Client>(`/clients/${clientId}`), props.searchParams])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Locais de ${client.name}`}
        description="Somente os locais deste cliente."
        actions={
          client.status === 'ACTIVE' && (
            <Link href={`/sites/new?clientId=${client.id}`} className={BUTTON_PRIMARY}>
              <IoAddOutline aria-hidden className="size-4" />
              Novo local
            </Link>
          )
        }
      />
      <SitesList searchParams={searchParams} pathname={`/clients/${client.id}/sites`} clientId={client.id} />
    </div>
  )
}
