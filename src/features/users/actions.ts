'use server'

import { redirect } from 'next/navigation'

import { actionError, formError, requireRole, send } from '@/lib/dal'
import { USER_ROLES, USER_STATUS_LABELS, USER_STATUSES, type UserRole, type UserStatus } from '@/lib/domain/user'
import { submittedValues, text } from '@/lib/form-data'
import type { ActionResult, FormState } from '@/lib/form-state'
import { assertId } from '@/lib/ids'

const ADMIN_ONLY: readonly UserRole[] = ['ADMIN']

function role(formData: FormData): UserRole | null {
  const value = text(formData, 'role')
  return value && (USER_ROLES as readonly string[]).includes(value) ? (value as UserRole) : null
}

function profile(formData: FormData) {
  return {
    name: text(formData, 'name'),
    email: text(formData, 'email'),
    role: role(formData),
    phone: text(formData, 'phone'),
  }
}

export async function createUser(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireRole(ADMIN_ONLY)
  const password = formData.get('password')
  const status = text(formData, 'status')

  try {
    await send('/users', {
      method: 'POST',
      body: {
        ...profile(formData),
        password: typeof password === 'string' ? password : null,
        status: status && (USER_STATUSES as readonly string[]).includes(status) ? status : 'ACTIVE',
      },
    })
  } catch (error) {
    return formError(error, submittedValues(formData))
  }

  redirect('/users?notice=created')
}

export async function updateUser(id: string, _previous: FormState, formData: FormData): Promise<FormState> {
  await requireRole(ADMIN_ONLY)
  const userId = assertId(id)

  try {
    await send(`/users/${userId}`, { method: 'PUT', body: profile(formData) })
  } catch (error) {
    return formError(error, submittedValues(formData))
  }

  redirect('/users?notice=updated')
}

/**
 * Bloquear ou inativar a propria conta trancaria o unico administrador do lado
 * de fora; a tela nem oferece o botao, e a action recusa de novo.
 */
export async function changeUserStatus(id: string, status: UserStatus): Promise<ActionResult> {
  const admin = await requireRole(ADMIN_ONLY)
  const userId = assertId(id)

  if (!USER_STATUSES.includes(status)) {
    return { ok: false, message: 'Situação inválida.' }
  }
  if (userId === admin.id && status !== 'ACTIVE') {
    return { ok: false, message: 'Você não pode bloquear ou inativar a sua própria conta.' }
  }

  try {
    await send(`/users/${userId}/status`, { method: 'PATCH', body: { status } })
  } catch (error) {
    return actionError(error)
  }

  return { ok: true, message: `Usuário agora está ${USER_STATUS_LABELS[status].toLowerCase()}.` }
}

/** A senha temporaria sai so nesta resposta: nao e gravada em log nem no historico. */
export async function resetUserPassword(id: string): Promise<ActionResult<string>> {
  await requireRole(ADMIN_ONLY)
  const userId = assertId(id)

  try {
    const { temporaryPassword } = await send<{ temporaryPassword: string }>(`/users/${userId}/reset-password`, {
      method: 'POST',
    })
    return { ok: true, message: 'Senha redefinida. As sessões do usuário foram encerradas.', data: temporaryPassword }
  } catch (error) {
    return actionError(error)
  }
}
