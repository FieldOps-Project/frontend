import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { BUTTON_SECONDARY, CARD } from '@/components/ui/styles'
import { updateSite } from '@/features/sites/actions'
import { SiteForm } from '@/features/sites/site-form'
import { SiteStatusActions } from '@/features/sites/site-status-actions'
import { load, requireRole } from '@/lib/dal'
import type { Client } from '@/lib/domain/client'
import { SITE_STATUS_LABELS, SITE_STATUS_TONES, type Site } from '@/lib/domain/site'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { formatDateTime } from '@/lib/format'
import { isId } from '@/lib/ids'

export default async function EditSitePage(props: PageProps<'/sites/[siteId]/edit'>) {
  await requireRole(MANAGER_ROLES)
  const { siteId } = await props.params
  if (!isId(siteId)) notFound()

  const site = await load<Site>(`/sites/${siteId}`)
  const client = await load<Client>(`/clients/${site.clientId}`)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={site.name}
        description={`${client.name} · atualizado em ${formatDateTime(site.updatedAt)}`}
        actions={
          <Link href={`/sites/${site.id}/equipment`} className={BUTTON_SECONDARY}>
            Ver equipamentos
          </Link>
        }
      />

      <section className={`${CARD} p-6`}>
        <SiteForm
          action={updateSite.bind(null, site.id)}
          site={site}
          clientName={client.name}
          submitLabel="Salvar alterações"
        />
      </section>

      <section className={`${CARD} flex flex-wrap items-center justify-between gap-4 p-6`}>
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-neutral-900">Situação</h2>
          <p className="flex items-center gap-2 text-sm text-neutral-500">
            Situação atual:
            <StatusBadge label={SITE_STATUS_LABELS[site.status]} tone={SITE_STATUS_TONES[site.status]} />
          </p>
        </div>
        <SiteStatusActions id={site.id} status={site.status} />
      </section>
    </div>
  )
}
