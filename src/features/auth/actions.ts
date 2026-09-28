'use server'

import { redirect } from 'next/navigation'

import type { RefreshTokenRequest } from '@/features/auth/contract'
import { apiFetch } from '@/lib/api/client'
import { clearSessionCookies, readRefreshToken } from '@/lib/session-cookies'

/**
 * Encerra a sessao e devolve a pessoa ao login.
 *
 * Primeiro revoga o refresh token em `POST /auth/logout`, depois apaga os
 * cookies. Apagar so o cookie deixaria o refresh token valido no servidor, e
 * uma copia feita antes do logout continuaria abrindo sessao.
 *
 * Se a API nao responder, os cookies sao apagados mesmo assim: a pessoa pediu
 * para sair e nao pode ficar presa numa sessao aberta por falha de rede. O
 * token restante expira pela validade definida no backend.
 */
export async function signOut(): Promise<never> {
  const refreshToken = await readRefreshToken()

  if (refreshToken) {
    const body: RefreshTokenRequest = { refreshToken }
    await apiFetch<void>('/auth/logout', { method: 'POST', body }).catch(() => undefined)
  }

  await clearSessionCookies()

  redirect('/login')
}
