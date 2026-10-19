'use server'

import { redirect } from 'next/navigation'

import { actionError, formError, requireRole, send } from '@/lib/dal'
import { CLIENT_STATUS_LABELS, CLIENT_STATUSES, type ClientStatus } from '@/lib/domain/client'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { submittedValues, text } from '@/lib/form-data'
import type { ActionResult, FormState } from '@/lib/form-state'
import { assertId } from '@/lib/ids'

function payload(formData: FormData) {
  return {
    name: text(formData, 'name'),
    legalName: text(formData, 'legalName'),
    document: text(formData, 'document'),
    email: text(formData, 'email'),
    phone: text(formData, 'phone'),
  }
}

export async function createClient(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireRole(MANAGER_ROLES)

  try {
    await send('/clients', { method: 'POST', body: payload(formData) })
  } catch (error) {
    return formError(error, submittedValues(formData))
  }

  redirect('/clients?notice=created')
}

export async function updateClient(id: string, _previous: FormState, formData: FormData): Promise<FormState> {
  await requireRole(MANAGER_ROLES)
  const clientId = assertId(id)

  try {
    await send(`/clients/${clientId}`, { method: 'PUT', body: payload(formData) })
  } catch (error) {
    return formError(error, submittedValues(formData))
  }

  redirect('/clients?notice=updated')
}

export async function changeClientStatus(id: string, status: ClientStatus): Promise<ActionResult> {
  await requireRole(MANAGER_ROLES)
  const clientId = assertId(id)

  if (!CLIENT_STATUSES.includes(status)) {
    return { ok: false, message: 'Situação inválida.' }
  }

  try {
    await send(`/clients/${clientId}/status`, { method: 'PATCH', body: { status } })
  } catch (error) {
    return actionError(error)
  }

  return { ok: true, message: `Cliente agora está ${CLIENT_STATUS_LABELS[status].toLowerCase()}.` }
}
