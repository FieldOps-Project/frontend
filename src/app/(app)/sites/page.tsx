import Link from 'next/link'
import { IoAddOutline } from 'react-icons/io5'

import { FlashNotice } from '@/components/ui/notice'
import { PageHeader } from '@/components/ui/page-header'
import { BUTTON_PRIMARY } from '@/components/ui/styles'
import { SitesList } from '@/features/sites/sites-list'
import { requireRole } from '@/lib/dal'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { param } from '@/lib/search-params'

export default async function SitesPage(props: PageProps<'/sites'>) {
  await requireRole(MANAGER_ROLES)
  const searchParams = await props.searchParams

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Locais"
        description="Endereços dos clientes onde as inspeções acontecem."
        actions={
          <Link href="/sites/new" className={BUTTON_PRIMARY}>
            <IoAddOutline aria-hidden className="size-4" />
            Novo local
          </Link>
        }
      />
      <FlashNotice code={param(searchParams, 'notice')} />
      <SitesList searchParams={searchParams} pathname="/sites" />
    </div>
  )
}
