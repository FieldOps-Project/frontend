import 'server-only'

import { notFound, redirect } from 'next/navigation'

import { apiFetch, type ApiRequest, type QueryValue } from '@/lib/api/client'
import { isApiError } from '@/lib/api/errors'
import { fieldErrorsFor, messageFor } from '@/lib/api/messages'
import type { UserRole } from '@/lib/domain/user'
import type { ActionResult, FormState } from '@/lib/form-state'
import { loginPath } from '@/lib/session-cookies'
import {
  getAccessToken,
  getSessionUser,
  handleExpiredSession,
  refreshTokens,
  type SessionUser,
} from '@/lib/session'

export const verifySession = getSessionUser

export async function requireRole(roles: readonly UserRole[]): Promise<SessionUser> {
  const user = await verifySession()

  if (!roles.includes(user.role)) {
    redirect('/forbidden')
  }

  return user
}

type Query = Readonly<Record<string, QueryValue>>

async function read<T>(path: string, query: Query | undefined, nullOn: readonly number[]): Promise<T | null> {
  const token = await getAccessToken()

  try {
    return await apiFetch<T>(path, { token, query })
  } catch (error) {
    if (isApiError(error)) {
      if (nullOn.includes(error.status)) return null
      if (error.status === 401) return handleExpiredSession()
      if (error.status === 403) redirect('/forbidden')
      if (error.status === 404) notFound()
    }
    throw error
  }
}

export async function load<T>(path: string, query?: Query): Promise<T> {
  return (await read<T>(path, query, [])) as T
}

export function loadOptional<T>(path: string, query?: Query): Promise<T | null> {
  return read<T>(path, query, [404, 501])
}

export function loadIfPermitted<T>(path: string, query?: Query): Promise<T | null> {
  return read<T>(path, query, [403, 404])
}

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
  if (renewed.kind === 'ended') {
    redirect(loginPath(renewed))
  }

  return apiFetch<T>(path, { ...request, token: renewed.tokens.accessToken })
}

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
