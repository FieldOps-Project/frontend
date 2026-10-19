import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { BUTTON_SECONDARY, CARD } from '@/components/ui/styles'
import { updateClient } from '@/features/clients/actions'
import { ClientForm } from '@/features/clients/client-form'
import { ClientStatusActions } from '@/features/clients/client-status-actions'
import { load, requireRole } from '@/lib/dal'
import { CLIENT_STATUS_LABELS, CLIENT_STATUS_TONES, type Client } from '@/lib/domain/client'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { formatDateTime } from '@/lib/format'
import { isId } from '@/lib/ids'

export default async function EditClientPage(props: PageProps<'/clients/[clientId]/edit'>) {
  await requireRole(MANAGER_ROLES)
  const { clientId } = await props.params
  if (!isId(clientId)) notFound()

  const client = await load<Client>(`/clients/${clientId}`)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={client.name}
        description={`Atualizado em ${formatDateTime(client.updatedAt)}`}
        actions={
          <Link href={`/clients/${client.id}/sites`} className={BUTTON_SECONDARY}>
            Ver locais
          </Link>
        }
      />

      <section className={`${CARD} p-6`}>
        <ClientForm action={updateClient.bind(null, client.id)} client={client} submitLabel="Salvar alterações" />
      </section>

      <section className={`${CARD} flex flex-wrap items-center justify-between gap-4 p-6`}>
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-neutral-900">Situação</h2>
          <p className="flex items-center gap-2 text-sm text-neutral-500">
            Situação atual:
            <StatusBadge label={CLIENT_STATUS_LABELS[client.status]} tone={CLIENT_STATUS_TONES[client.status]} />
          </p>
        </div>
        <ClientStatusActions id={client.id} status={client.status} />
      </section>
    </div>
  )
}
