import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PageHeader } from '@/components/ui/page-header'
import { BUTTON_SECONDARY } from '@/components/ui/styles'
import { PrintButton } from '@/features/equipment/print-button'
import { QrCodeView } from '@/features/equipment/qr-code'
import { load, requireRole } from '@/lib/dal'
import type { Equipment } from '@/lib/domain/equipment'
import type { Site } from '@/lib/domain/site'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { orDash } from '@/lib/format'
import { isId } from '@/lib/ids'

/**
 * Etiqueta para colar no ativo. Na impressao, so a etiqueta sai no papel: o
 * shell, o cabecalho e os botoes somem pelo CSS de impressao. O QR tem 4 cm,
 * tamanho que a camera do celular le a um palmo de distancia.
 */
export default async function EquipmentLabelPage(props: PageProps<'/equipment/[equipmentId]/label'>) {
  await requireRole(MANAGER_ROLES)
  const { equipmentId } = await props.params
  if (!isId(equipmentId)) notFound()

  const equipment = await load<Equipment>(`/equipment/${equipmentId}`)
  const site = await load<Site>(`/sites/${equipment.siteId}`)

  return (
    <div className="flex flex-col gap-6">
      <div className="print:hidden">
        <PageHeader
          title="Etiqueta do equipamento"
          description="Confira os dados e imprima. Na impressão, somente a etiqueta sai no papel."
          actions={
            <>
              <Link href={`/equipment/${equipment.id}`} className={BUTTON_SECONDARY}>
                Voltar
              </Link>
              <PrintButton />
            </>
          }
        />
      </div>

      <article
        id="equipment-label"
        className="flex w-[9cm] items-center gap-4 rounded-card border-2 border-neutral-900 bg-neutral-0 p-4 text-neutral-900 print:rounded-none"
      >
        <QrCodeView value={equipment.qrCode} size={151} label={`QR Code ${equipment.qrCode}`} />
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-[10px] font-semibold tracking-widest uppercase">FieldOps</span>
          <strong className="text-sm leading-tight">{equipment.name}</strong>
          <span className="text-xs">Patrimônio: {orDash(equipment.assetNumber)}</span>
          <span className="text-xs">{site.name}</span>
          <span className="font-mono text-[10px] break-all">{equipment.qrCode}</span>
        </div>
      </article>
    </div>
  )
}
