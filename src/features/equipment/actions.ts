'use server'

import { redirect } from 'next/navigation'

import { isApiError } from '@/lib/api/errors'
import { messageFor } from '@/lib/api/messages'
import { actionError, formError, requireRole, send } from '@/lib/dal'
import {
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_STATUSES,
  generateQrCode,
  type Equipment,
  type EquipmentStatus,
} from '@/lib/domain/equipment'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { submittedValues, text } from '@/lib/form-data'
import type { ActionResult, FormState } from '@/lib/form-state'
import { assertId } from '@/lib/ids'

function payload(formData: FormData) {
  return {
    name: text(formData, 'name'),
    assetNumber: text(formData, 'assetNumber'),
    serialNumber: text(formData, 'serialNumber'),
    manufacturer: text(formData, 'manufacturer'),
    model: text(formData, 'model'),
    description: text(formData, 'description'),
    qrCode: text(formData, 'qrCode') ?? generateQrCode(),
    installedAt: text(formData, 'installedAt'),
  }
}

export async function createEquipment(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireRole(MANAGER_ROLES)
  const siteId = text(formData, 'siteId')

  if (!siteId) {
    return {
      status: 'error',
      message: 'Revise os campos destacados.',
      fieldErrors: { siteId: 'Selecione o local.' },
      values: submittedValues(formData),
    }
  }

  let created: Equipment
  try {
    created = await send<Equipment>('/equipment', {
      method: 'POST',
      body: { siteId: assertId(siteId), ...payload(formData) },
    })
  } catch (error) {
    return formError(error, submittedValues(formData))
  }

  redirect(`/equipment/${created.id}?notice=created`)
}

export async function updateEquipment(id: string, _previous: FormState, formData: FormData): Promise<FormState> {
  await requireRole(MANAGER_ROLES)
  const equipmentId = assertId(id)

  try {
    await send(`/equipment/${equipmentId}`, { method: 'PUT', body: payload(formData) })
  } catch (error) {
    return formError(error, submittedValues(formData))
  }

  redirect(`/equipment/${equipmentId}?notice=updated`)
}

export async function changeEquipmentStatus(id: string, status: EquipmentStatus): Promise<ActionResult> {
  await requireRole(MANAGER_ROLES)
  const equipmentId = assertId(id)

  if (!EQUIPMENT_STATUSES.includes(status)) {
    return { ok: false, message: 'Situação inválida.' }
  }

  try {
    await send(`/equipment/${equipmentId}/status`, { method: 'PATCH', body: { status } })
  } catch (error) {
    return actionError(error)
  }

  return { ok: true, message: `Equipamento agora está ${EQUIPMENT_STATUS_LABELS[status].toLowerCase()}.` }
}

export type QrLookupState = { readonly error?: string; readonly code?: string }

/**
 * Mesma consulta que o aplicativo faz ao ler a etiqueta. Serve para conferir,
 * no painel, que o valor impresso aponta para o equipamento certo.
 */
export async function findEquipmentByQr(_previous: QrLookupState, formData: FormData): Promise<QrLookupState> {
  await requireRole(MANAGER_ROLES)
  const code = text(formData, 'qrCode')

  if (!code) {
    return { error: 'Informe o valor do QR Code.' }
  }

  let found: Equipment
  try {
    found = await send<Equipment>(`/equipment/by-qr/${encodeURIComponent(code)}`, { method: 'GET' })
  } catch (error) {
    if (isApiError(error)) {
      return { error: messageFor(error), code }
    }
    throw error
  }

  redirect(`/equipment/${found.id}`)
}
