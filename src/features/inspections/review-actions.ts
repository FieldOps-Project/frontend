'use server'

import { revalidatePath } from 'next/cache'

import { isDemoReview } from '@/features/inspections/review-data'
import { actionError, requireRole, send } from '@/lib/dal'
import type { ActionResult } from '@/lib/form-state'
import { assertId } from '@/lib/ids'

/** Mesmo limite de texto livre usado nos cadastros. */
const TEXT_MAX_LENGTH = 1000

const DEMO_NOTICE = 'Demonstração: a decisão não é enviada à API.'

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? ''
  return trimmed === '' ? null : trimmed.slice(0, TEXT_MAX_LENGTH)
}

/**
 * Aprova a inspecao. A API registra supervisor e horario (RN-081) e protege as
 * respostas contra edicao comum (RN-082); o comentario e opcional.
 */
export async function approveInspection(id: string, comments: string | null): Promise<ActionResult> {
  await requireRole(['SUPERVISOR'])
  const inspectionId = assertId(id)

  if (isDemoReview(inspectionId)) {
    return { ok: false, message: DEMO_NOTICE }
  }

  try {
    await send(`/inspections/${inspectionId}/approve`, { method: 'POST', body: { comments: clean(comments) } })
  } catch (error) {
    return actionError(error)
  }

  revalidatePath(`/inspections/${inspectionId}/review`)
  return { ok: true, message: 'Inspeção aprovada.' }
}

/**
 * Reprova a inspecao. Sem motivo a acao e bloqueada (RN-080 e AC-REVIEW); os
 * itens marcados voltam ao tecnico para correcao na proxima sincronizacao.
 */
export async function rejectInspection(
  id: string,
  reason: string,
  itemsToCorrect: readonly string[],
): Promise<ActionResult> {
  await requireRole(['SUPERVISOR'])
  const inspectionId = assertId(id)
  const items = itemsToCorrect.map(assertId)
  const cleanReason = clean(reason)

  if (!cleanReason) {
    return { ok: false, message: 'Informe o motivo da reprovação.' }
  }

  if (isDemoReview(inspectionId)) {
    return { ok: false, message: DEMO_NOTICE }
  }

  try {
    await send(`/inspections/${inspectionId}/reject`, {
      method: 'POST',
      body: { reason: cleanReason, itemsToCorrect: items },
    })
  } catch (error) {
    return actionError(error)
  }

  revalidatePath(`/inspections/${inspectionId}/review`)
  return { ok: true, message: 'Inspeção reprovada. O técnico recebe o motivo na próxima sincronização.' }
}
