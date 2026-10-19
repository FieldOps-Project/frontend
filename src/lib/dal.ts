import 'server-only'

import { notFound, redirect } from 'next/navigation'

import { apiFetch, type ApiRequest, type QueryValue } from '@/lib/api/client'
import { isApiError } from '@/lib/api/errors'
import { fieldErrorsFor, messageFor } from '@/lib/api/messages'
import type { UserRole } from '@/lib/domain/user'
import type { ActionResult, FormState } from '@/lib/form-state'
import {
  getAccessToken,
  getSessionUser,
  handleExpiredSession,
  refreshTokens,
  type SessionUser,
} from '@/lib/session'

/**
 * Camada de acesso a dados (documento 14.13).
 *
 * E a barreira real do painel: o `proxy.ts` so olha se existe cookie. Cada
 * Server Component, Server Action e Route Handler e um ponto de entrada
 * independente e invocavel diretamente, entao todos passam por aqui.
 */
export const verifySession = getSessionUser

/** Perfil fora da lista vai para `/forbidden` -- 403 nao e 401. */
export async function requireRole(roles: readonly UserRole[]): Promise<SessionUser> {
  const user = await verifySession()

  if (!roles.includes(user.role)) {
    redirect('/forbidden')
  }

  return user
}

/**
 * Leitura para Server Components. 401 leva a renovacao da sessao, 403 a
 * pagina de acesso negado e 404 ao `not-found` da rota; o restante sobe para o
 * `error.tsx` mais proximo.
 */
export async function load<T>(path: string, query?: Readonly<Record<string, QueryValue>>): Promise<T> {
  const token = await getAccessToken()

  try {
    return await apiFetch<T>(path, { token, query })
  } catch (error) {
    if (isApiError(error)) {
      if (error.status === 401) return handleExpiredSession()
      if (error.status === 403) redirect('/forbidden')
      if (error.status === 404) notFound()
    }
    throw error
  }
}

/**
 * Chamada de escrita para Server Actions. Se o access token expirou, renova a
 * sessao e repete a operacao **uma unica vez** -- sem esse limite, um 401
 * persistente vira laco infinito.
 */
export async function send<T>(path: string, request: Omit<ApiRequest, 'token'>): Promise<T> {
  const token = await getAccessToken()

  if (token) {
    try {
      return await apiFetch<T>(path, { ...request, token })
    } catch (error) {
      if (!(isApiError(error) && error.status === 401)) {
        throw error
      }
    }
  }

  const renewed = await refreshTokens()
  if (!renewed) {
    redirect('/login?expired=1')
  }

  return apiFetch<T>(path, { ...request, token: renewed.accessToken })
}

/** Converte erro da API em estado de formulario, com a mensagem no campo certo. */
export function formError(error: unknown, values: Record<string, string>): FormState {
  if (!isApiError(error)) {
    throw error
  }

  return {
    status: 'error',
    message: messageFor(error),
    fieldErrors: fieldErrorsFor(error),
    values,
  }
}

export function actionError(error: unknown): ActionResult<never> {
  if (!isApiError(error)) {
    throw error
  }

  return { ok: false, message: messageFor(error) }
}
