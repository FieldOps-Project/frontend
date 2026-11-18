'use server'

import { revalidatePath } from 'next/cache'

import { isDemoInspection, loadInspectionDetail } from '@/features/inspections/detail-data'
import { recordDemoInspectionChange } from '@/features/inspections/inspection-demo-store'
import { actionError, requireRole, send } from '@/lib/dal'
import {
  CANCEL_REASON_MAX_LENGTH,
  canCancel,
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

/**
 * Cancela a inspecao (documento 14.9, issue #18). Sem justificativa a acao e
 * bloqueada (RN-029 e AC-SCHEDULING); a API registra usuario e data e recusa
 * com 409 a transicao invalida, como cancelar inspecao aprovada (RN-030 e
 * RN-089). Administrador e supervisor cancelam, como agendam (matriz 5.2).
 */
export async function cancelInspection(id: string, reason: string): Promise<ActionResult> {
  const user = await requireRole(MANAGER_ROLES)
  const inspectionId = assertId(id)
  const cleanReason = reason.trim()

  if (cleanReason === '') {
    return { ok: false, message: 'Informe o motivo do cancelamento.' }
  }
  if (cleanReason.length > CANCEL_REASON_MAX_LENGTH) {
    return { ok: false, message: `Use no máximo ${CANCEL_REASON_MAX_LENGTH} caracteres no motivo.` }
  }

  if (isDemoInspection(inspectionId)) {
    const inspection = await loadInspectionDetail(inspectionId)
    if (!canCancel(inspection.status)) {
      return { ok: false, message: 'Esta inspeção não pode mais ser cancelada.' }
    }
    const now = new Date().toISOString()
    recordDemoInspectionChange(
      inspectionId,
      { status: 'CANCELED', canceledByName: user.name, canceledAt: now, canceledReason: cleanReason, updatedAt: now },
      {
        id: crypto.randomUUID(),
        action: 'INSPECTION_CANCELED',
        actorName: user.name,
        occurredAt: now,
        deviceOccurredAt: null,
        previousStatus: inspection.status,
        newStatus: 'CANCELED',
        note: cleanReason,
      },
    )
    revalidateInspection(inspectionId)
    return { ok: true, message: 'Inspeção cancelada (demonstração: guardado até reiniciar o servidor).' }
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
