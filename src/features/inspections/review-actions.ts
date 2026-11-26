'use server'

import { revalidatePath } from 'next/cache'

import { actionError, requireRole, send } from '@/lib/dal'
import { REVIEW_TEXT_MAX_LENGTH } from '@/lib/domain/inspection-review'
import type { ActionResult } from '@/lib/form-state'
import { assertId } from '@/lib/ids'

function revalidateReview(id: string) {
  revalidatePath(`/inspections/${id}/review`)
  revalidatePath(`/inspections/${id}`)
  revalidatePath('/inspections')
  revalidatePath('/inspections/review-queue')
  revalidatePath('/dashboard')
}

function tooLong(label: string): ActionResult {
  return { ok: false, message: `Use no máximo ${REVIEW_TEXT_MAX_LENGTH} caracteres ${label}.` }
}

async function transition(id: string, action: string, body: object | undefined, message: string): Promise<ActionResult> {
  try {
    await send(`/inspections/${id}/${action}`, { method: 'POST', body })
  } catch (error) {
    return actionError(error)
  }

  revalidateReview(id)
  return { ok: true, message }
}

export async function beginReview(id: string): Promise<ActionResult> {
  await requireRole(['SUPERVISOR'])
  return transition(assertId(id), 'begin-review', undefined, 'Revisão iniciada.')
}

export async function approveInspection(id: string, comments: string | null): Promise<ActionResult> {
  await requireRole(['SUPERVISOR'])
  const inspectionId = assertId(id)
  const cleanComments = comments?.trim() || null

  if (cleanComments && cleanComments.length > REVIEW_TEXT_MAX_LENGTH) {
    return tooLong('no comentário')
  }

  return transition(inspectionId, 'approve', { comments: cleanComments }, 'Inspeção aprovada.')
}

export async function rejectInspection(
  id: string,
  reason: string,
  itemsToCorrect: readonly string[],
): Promise<ActionResult> {
  await requireRole(['SUPERVISOR'])
  const inspectionId = assertId(id)
  const items = itemsToCorrect.map(assertId)
  const cleanReason = reason.trim()

  if (cleanReason === '') {
    return { ok: false, message: 'Informe o motivo da reprovação.' }
  }
  if (cleanReason.length > REVIEW_TEXT_MAX_LENGTH) {
    return tooLong('no motivo')
  }

  return transition(
    inspectionId,
    'reject',
    { reason: cleanReason, itemsToCorrect: items },
    'Inspeção reprovada. O técnico recebe o motivo na próxima sincronização.',
  )
}
