import Link from 'next/link'
import { notFound } from 'next/navigation'
import { IoAddOutline } from 'react-icons/io5'

import { PageHeader } from '@/components/ui/page-header'
import { BUTTON_PRIMARY } from '@/components/ui/styles'
import { EquipmentList } from '@/features/equipment/equipment-list'
import { load, requireRole } from '@/lib/dal'
import type { Site } from '@/lib/domain/site'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { isId } from '@/lib/ids'

export default async function SiteEquipmentPage(props: PageProps<'/sites/[siteId]/equipment'>) {
  await requireRole(MANAGER_ROLES)
  const { siteId } = await props.params
  if (!isId(siteId)) notFound()

  const [site, searchParams] = await Promise.all([load<Site>(`/sites/${siteId}`), props.searchParams])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Equipamentos de ${site.name}`}
        description="Somente os equipamentos deste local."
        actions={
          site.status === 'ACTIVE' && (
            <Link href={`/equipment/new?siteId=${site.id}`} className={BUTTON_PRIMARY}>
              <IoAddOutline aria-hidden className="size-4" />
              Novo equipamento
            </Link>
          )
        }
      />
      <EquipmentList searchParams={searchParams} pathname={`/sites/${site.id}/equipment`} siteId={site.id} />
    </div>
  )
}
