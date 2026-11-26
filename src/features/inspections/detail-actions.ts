'use server'

import { revalidatePath } from 'next/cache'

import { actionError, requireRole, send } from '@/lib/dal'
import {
  CANCEL_REASON_MAX_LENGTH,
  type CancelInspectionRequest,
  type InspectionTransitionResponse,
} from '@/lib/domain/inspection-detail'
import { MANAGER_ROLES } from '@/lib/domain/user'
import type { ActionResult } from '@/lib/form-state'
import { assertId } from '@/lib/ids'

function revalidateInspection(id: string) {
  revalidatePath(`/inspections/${id}`)
  revalidatePath('/inspections')
  revalidatePath('/dashboard')
}

export async function cancelInspection(id: string, reason: string): Promise<ActionResult> {
  await requireRole(MANAGER_ROLES)
  const inspectionId = assertId(id)
  const cleanReason = reason.trim()

  if (cleanReason === '') {
    return { ok: false, message: 'Informe o motivo do cancelamento.' }
  }
  if (cleanReason.length > CANCEL_REASON_MAX_LENGTH) {
    return { ok: false, message: `Use no máximo ${CANCEL_REASON_MAX_LENGTH} caracteres no motivo.` }
  }

  try {
    const body: CancelInspectionRequest = { reason: cleanReason }
    await send<InspectionTransitionResponse>(`/inspections/${inspectionId}/cancel`, { method: 'POST', body })
  } catch (error) {
    return actionError(error)
  }

  revalidateInspection(inspectionId)
  return { ok: true, message: 'Inspeção cancelada.' }
}
