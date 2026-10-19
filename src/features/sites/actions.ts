'use server'

import { redirect } from 'next/navigation'

import { actionError, formError, requireRole, send } from '@/lib/dal'
import { SITE_STATUS_LABELS, SITE_STATUSES, type SiteStatus } from '@/lib/domain/site'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { number, submittedValues, text } from '@/lib/form-data'
import type { ActionResult, FormState } from '@/lib/form-state'
import { assertId } from '@/lib/ids'

function payload(formData: FormData) {
  return {
    name: text(formData, 'name'),
    description: text(formData, 'description'),
    addressLine: text(formData, 'addressLine'),
    city: text(formData, 'city'),
    state: text(formData, 'state'),
    postalCode: text(formData, 'postalCode'),
    latitude: number(formData, 'latitude'),
    longitude: number(formData, 'longitude'),
    contactName: text(formData, 'contactName'),
    contactPhone: text(formData, 'contactPhone'),
  }
}

export async function createSite(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireRole(MANAGER_ROLES)
  const clientId = text(formData, 'clientId')

  if (!clientId) {
    return {
      status: 'error',
      message: 'Revise os campos destacados.',
      fieldErrors: { clientId: 'Selecione o cliente.' },
      values: submittedValues(formData),
    }
  }

  try {
    await send('/sites', { method: 'POST', body: { clientId: assertId(clientId), ...payload(formData) } })
  } catch (error) {
    return formError(error, submittedValues(formData))
  }

  redirect('/sites?notice=created')
}

/** O cliente e imutavel apos a criacao (RN-009): o payload de edicao nem o carrega. */
export async function updateSite(id: string, _previous: FormState, formData: FormData): Promise<FormState> {
  await requireRole(MANAGER_ROLES)
  const siteId = assertId(id)

  try {
    await send(`/sites/${siteId}`, { method: 'PUT', body: payload(formData) })
  } catch (error) {
    return formError(error, submittedValues(formData))
  }

  redirect('/sites?notice=updated')
}

export async function changeSiteStatus(id: string, status: SiteStatus): Promise<ActionResult> {
  await requireRole(MANAGER_ROLES)
  const siteId = assertId(id)

  if (!SITE_STATUSES.includes(status)) {
    return { ok: false, message: 'Situação inválida.' }
  }

  try {
    await send(`/sites/${siteId}/status`, { method: 'PATCH', body: { status } })
  } catch (error) {
    return actionError(error)
  }

  return { ok: true, message: `Local agora está ${SITE_STATUS_LABELS[status].toLowerCase()}.` }
}
