import { notFound } from 'next/navigation'

import { PageHeader } from '@/components/ui/page-header'
import { CARD } from '@/components/ui/styles'
import { updateEquipment } from '@/features/equipment/actions'
import { EquipmentForm } from '@/features/equipment/equipment-form'
import { load, requireRole } from '@/lib/dal'
import type { Equipment } from '@/lib/domain/equipment'
import type { Site } from '@/lib/domain/site'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { isId } from '@/lib/ids'

export default async function EditEquipmentPage(props: PageProps<'/equipment/[equipmentId]/edit'>) {
  await requireRole(MANAGER_ROLES)
  const { equipmentId } = await props.params
  if (!isId(equipmentId)) notFound()

  const equipment = await load<Equipment>(`/equipment/${equipmentId}`)
  const site = await load<Site>(`/sites/${equipment.siteId}`)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Editar ${equipment.name}`} description="O local do equipamento não pode ser alterado." />
      <section className={`${CARD} p-6`}>
        <EquipmentForm
          action={updateEquipment.bind(null, equipment.id)}
          equipment={equipment}
          siteName={site.name}
          submitLabel="Salvar alterações"
          cancelHref={`/equipment/${equipment.id}`}
        />
      </section>
    </div>
  )
}
