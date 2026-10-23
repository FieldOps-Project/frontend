'use server'

import { redirect } from 'next/navigation'

import { hasLoginErrors, validateLogin, type LoginFieldErrors } from '@/features/auth/login-validation'
import { apiFetch } from '@/lib/api/client'
import { isApiError, type ApiError } from '@/lib/api/errors'
import { fieldErrorsFor, messageFor } from '@/lib/api/messages'
import { text } from '@/lib/form-data'
import { safeRedirect } from '@/lib/redirect'
import { clearSession, getRefreshToken, storeTokens, type SessionUser, type TokenPair } from '@/lib/session'

export type SignInState = {
  /** Mensagem geral, como credencial recusada ou API fora do ar. */
  readonly error?: string
  /** Erro de cada campo, para a mensagem aparecer embaixo do campo certo. */
  readonly fieldErrors?: LoginFieldErrors
  /** Devolvido para o formulario nao apagar o que a pessoa digitou. */
  readonly email?: string
}

type LoginResponse = TokenPair & { readonly user: SessionUser }

/** So os campos que existem no formulario; outro campo vindo da API nao tem onde aparecer. */
function loginFieldErrorsFor(error: ApiError): LoginFieldErrors | undefined {
  const { email, password } = fieldErrorsFor(error)
  return email || password ? { email, password } : undefined
}

/**
 * Entrada no painel.
 *
 * A action e ponto de entrada publico, entao valida de novo o que o formulario
 * ja exige. Credencial invalida e e-mail inexistente recebem a mesma mensagem
 * (a API ja nao distingue); conta inativa recebe orientacao propria (RN-001).
 */
export async function signIn(_previous: SignInState, formData: FormData): Promise<SignInState> {
  const email = text(formData, 'email')
  const password = formData.get('password')

  const fieldErrors = validateLogin({ email, password })

  if (!email || typeof password !== 'string' || hasLoginErrors(fieldErrors)) {
    return { fieldErrors, email: email ?? '' }
  }

  try {
    const session = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
      token: null,
    })
    await storeTokens(session)
  } catch (error) {
    if (isApiError(error)) {
      return { error: messageFor(error), fieldErrors: loginFieldErrorsFor(error), email }
    }
    throw error
  }

  redirect(safeRedirect(formData.get('redirect')))
}

/**
 * Encerra a sessao e devolve a pessoa ao login.
 *
 * Revoga o refresh token na API antes de apagar os cookies: sem a revogacao,
 * um refresh token copiado antes do logout continuaria valendo. Falha na
 * revogacao nao impede a saida local.
 */
export async function signOut(): Promise<never> {
  const refreshToken = await getRefreshToken()

  if (refreshToken) {
    await apiFetch('/auth/logout', { method: 'POST', body: { refreshToken }, token: null }).catch(() => undefined)
  }

  await clearSession()
  redirect('/login')
}
