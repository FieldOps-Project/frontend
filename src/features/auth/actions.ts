'use server'

import { redirect } from 'next/navigation'

import { apiFetch } from '@/lib/api/client'
import { isApiError } from '@/lib/api/errors'
import { messageFor } from '@/lib/api/messages'
import { text } from '@/lib/form-data'
import { safeRedirect } from '@/lib/redirect'
import { clearSession, getRefreshToken, storeTokens, type SessionUser, type TokenPair } from '@/lib/session'

export type SignInState = {
  readonly error?: string
  readonly email?: string
}

type LoginResponse = TokenPair & { readonly user: SessionUser }

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

  if (!email || typeof password !== 'string' || password === '') {
    return { error: 'Informe e-mail e senha.', email: email ?? '' }
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
      return { error: messageFor(error), email }
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
