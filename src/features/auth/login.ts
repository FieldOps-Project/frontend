'use server'

import { redirect } from 'next/navigation'

import type { LoginRequest, LoginResponse, RefreshTokenRequest } from '@/features/auth/contract'
import { AUTH_MESSAGES, loginErrorMessage } from '@/features/auth/error-messages'
import { safeRedirectTarget } from '@/features/auth/redirect-target'
import { apiFetch } from '@/lib/api/client'
import { ApiError } from '@/lib/api/errors'
import { setSessionCookies } from '@/lib/session-cookies'
import { loginSchema } from '@/schemas/login'

type LoginField = 'email' | 'password'

export type LoginState = {
  readonly message?: string
  readonly fieldErrors?: Partial<Record<LoginField, string>>
  /** Devolvido para o formulario nao apagar o que a pessoa digitou. */
  readonly email?: string
}

function isLoginField(value: string): value is LoginField {
  return value === 'email' || value === 'password'
}

function fieldErrorsFromApi(error: unknown): LoginState['fieldErrors'] {
  if (!(error instanceof ApiError)) return undefined

  const entries = error.fieldErrors
    .filter((fieldError) => isLoginField(fieldError.field))
    .map((fieldError) => [fieldError.field, 'Valor inválido.'] as const)

  return entries.length > 0 ? Object.fromEntries(entries) : undefined
}

/**
 * Revoga o refresh token recem-emitido para quem o painel recusa. Melhor
 * esforco: se a API falhar aqui, o token expira sozinho e nunca chegou a ser
 * gravado em cookie.
 */
async function revoke(refreshToken: string) {
  const body: RefreshTokenRequest = { refreshToken }
  await apiFetch<void>('/auth/logout', { method: 'POST', body }).catch(() => undefined)
}

/**
 * Autentica no `POST /auth/login` a partir do servidor do Next.
 *
 * O formulario e revalidado aqui porque a Server Action e um ponto de entrada
 * publico, invocavel sem passar pela tela. Os tokens vao direto para cookies
 * `httpOnly` e nunca voltam ao navegador no estado da acao.
 *
 * O perfil Tecnico e recusado: o painel e a ferramenta de administracao e
 * supervisao, e o tecnico trabalha pelo aplicativo de campo. Decisao
 * provisoria, a confirmar com o grupo.
 */
export async function signIn(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const rawEmail = formData.get('email')
  const email = typeof rawEmail === 'string' ? rawEmail : ''

  const parsed = loginSchema.safeParse({ email, password: formData.get('password') ?? '' })

  if (!parsed.success) {
    const fieldErrors: Partial<Record<LoginField, string>> = {}
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0])
      if (isLoginField(field) && !fieldErrors[field]) {
        fieldErrors[field] = issue.message
      }
    }
    return { fieldErrors, email }
  }

  let session: LoginResponse
  try {
    const body: LoginRequest = parsed.data
    session = await apiFetch<LoginResponse>('/auth/login', { method: 'POST', body })
  } catch (error) {
    return { message: loginErrorMessage(error), fieldErrors: fieldErrorsFromApi(error), email }
  }

  if (session.user.role === 'TECHNICIAN') {
    await revoke(session.refreshToken)
    return { message: AUTH_MESSAGES.technicianNotAllowed, email }
  }

  await setSessionCookies(session)

  redirect(safeRedirectTarget(formData.get('redirect')))
}
