import Link from 'next/link'
import { IoAddOutline } from 'react-icons/io5'

import { FlashNotice } from '@/components/ui/notice'
import { PageHeader } from '@/components/ui/page-header'
import { BUTTON_PRIMARY } from '@/components/ui/styles'
import { EquipmentList } from '@/features/equipment/equipment-list'
import { QrLookup } from '@/features/equipment/qr-lookup'
import { requireRole } from '@/lib/dal'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { param } from '@/lib/search-params'

export default async function EquipmentPage(props: PageProps<'/equipment'>) {
  await requireRole(MANAGER_ROLES)
  const searchParams = await props.searchParams

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Equipamentos"
        description="Ativos inspecionados em campo. Cada um tem uma etiqueta de QR Code lida pelo aplicativo."
        actions={
          <Link href="/equipment/new" className={BUTTON_PRIMARY}>
            <IoAddOutline aria-hidden className="size-4" />
            Novo equipamento
          </Link>
        }
      />
      <FlashNotice code={param(searchParams, 'notice')} />
      <QrLookup />
      <EquipmentList searchParams={searchParams} pathname="/equipment" />
    </div>
  )
}
