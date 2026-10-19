import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { IoCreateOutline, IoPrintOutline } from 'react-icons/io5'

import { FlashNotice } from '@/components/ui/notice'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { BUTTON_SECONDARY, CARD, LINK } from '@/components/ui/styles'
import { EquipmentStatusActions } from '@/features/equipment/equipment-status-actions'
import { QrCodeView } from '@/features/equipment/qr-code'
import { load, requireRole } from '@/lib/dal'
import type { Client } from '@/lib/domain/client'
import {
  EQUIPMENT_STATUS_HINTS,
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_STATUS_TONES,
  type Equipment,
} from '@/lib/domain/equipment'
import type { Site } from '@/lib/domain/site'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { formatDate, formatDateTime, orDash } from '@/lib/format'
import { isId } from '@/lib/ids'
import { param } from '@/lib/search-params'

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium tracking-wide text-neutral-500 uppercase">{label}</dt>
      <dd className="text-sm text-neutral-800">{children}</dd>
    </div>
  )
}

export default async function EquipmentDetailPage(props: PageProps<'/equipment/[equipmentId]'>) {
  await requireRole(MANAGER_ROLES)
  const { equipmentId } = await props.params
  if (!isId(equipmentId)) notFound()

  const [equipment, searchParams] = await Promise.all([load<Equipment>(`/equipment/${equipmentId}`), props.searchParams])
  const site = await load<Site>(`/sites/${equipment.siteId}`)
  const client = await load<Client>(`/clients/${site.clientId}`)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={equipment.name}
        description={`${site.name} · ${client.name}`}
        actions={
          <>
            <Link href={`/equipment/${equipment.id}/label`} className={BUTTON_SECONDARY}>
              <IoPrintOutline aria-hidden className="size-4" />
              Imprimir etiqueta
            </Link>
            <Link href={`/equipment/${equipment.id}/edit`} className={BUTTON_SECONDARY}>
              <IoCreateOutline aria-hidden className="size-4" />
              Editar
            </Link>
          </>
        }
      />

      <FlashNotice code={param(searchParams, 'notice')} />

      <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
        <section className={`${CARD} p-6`}>
          <dl className="grid gap-5 sm:grid-cols-2">
            <Detail label="Situação">
              <span className="flex flex-col items-start gap-1">
                <StatusBadge
                  label={EQUIPMENT_STATUS_LABELS[equipment.status]}
                  tone={EQUIPMENT_STATUS_TONES[equipment.status]}
                />
                <span className="text-xs text-neutral-500">{EQUIPMENT_STATUS_HINTS[equipment.status]}</span>
              </span>
            </Detail>
            <Detail label="Local">
              <Link href={`/sites/${site.id}/equipment`} className={LINK}>
                {site.name}
              </Link>
              <span className="block text-xs text-neutral-500">{client.name}</span>
            </Detail>
            <Detail label="Patrimônio">{orDash(equipment.assetNumber)}</Detail>
            <Detail label="Número de série">{orDash(equipment.serialNumber)}</Detail>
            <Detail label="Fabricante">{orDash(equipment.manufacturer)}</Detail>
            <Detail label="Modelo">{orDash(equipment.model)}</Detail>
            <Detail label="Instalação">{formatDate(equipment.installedAt)}</Detail>
            <Detail label="Atualizado em">{formatDateTime(equipment.updatedAt)}</Detail>
            <div className="sm:col-span-2">
              <Detail label="Descrição">{orDash(equipment.description)}</Detail>
            </div>
          </dl>
        </section>

        <section className={`${CARD} flex flex-col items-center gap-3 p-6`}>
          <h2 className="self-start text-base font-semibold text-neutral-900">QR Code</h2>
          <QrCodeView value={equipment.qrCode} label={`QR Code do equipamento ${equipment.name}`} />
          <code className="rounded-field bg-neutral-100 px-2 py-1 font-mono text-xs text-neutral-700">
            {equipment.qrCode}
          </code>
        </section>
      </div>

      <section className={`${CARD} flex flex-wrap items-center justify-between gap-4 p-6`}>
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-neutral-900">Situação</h2>
          <p className="text-sm text-neutral-500">
            Inativo pode voltar a operar; baixado foi retirado de uso definitivamente.
          </p>
        </div>
        <EquipmentStatusActions id={equipment.id} status={equipment.status} />
      </section>
    </div>
  )
}
