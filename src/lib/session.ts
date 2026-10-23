import 'server-only'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'

import { apiFetch } from '@/lib/api/client'
import { isApiError } from '@/lib/api/errors'
import { canUsePanel, type UserRole } from '@/lib/domain/user'
import {
  ACCESS_TOKEN_COOKIE,
  PANEL_DENIED_PATH,
  PATHNAME_HEADER,
  REFRESH_TOKEN_COOKIE,
  refreshPath,
} from '@/lib/session-cookies'

/**
 * Identidade minima que o shell precisa para se desenhar: quem esta na tela e
 * o que essa pessoa enxerga. Os campos sao os que a API devolve em
 * `GET /auth/me` e no corpo do login.
 */
export type SessionUser = {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly role: UserRole
}

export type TokenPair = {
  readonly accessToken: string
  readonly refreshToken: string
  readonly expiresIn: number
}

/** Mesmo valor padrao de `JWT_REFRESH_TOKEN_TTL` na API (P30D). */
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60

/**
 * O cookie do access token expira um pouco antes do proprio token. Assim o
 * proxy percebe a expiracao e renova antes de a API recusar a chamada no meio
 * de uma renderizacao.
 */
const ACCESS_TOKEN_MARGIN = 30

/** Marca curta gravada logo apos uma renovacao, para nunca renovar em laco. */
const REFRESHED_COOKIE = 'fo_rf'

/**
 * `secure` por padrao. Em demonstracao local por HTTP, fora de `localhost`, o
 * navegador descartaria o cookie; `SESSION_COOKIE_SECURE=false` existe para
 * esse caso e nunca deve ser usado em ambiente publicado.
 */
function secureCookies(): boolean {
  return process.env.SESSION_COOKIE_SECURE !== 'false'
}

export async function getAccessToken(): Promise<string | null> {
  return (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value ?? null
}

export async function getRefreshToken(): Promise<string | null> {
  return (await cookies()).get(REFRESH_TOKEN_COOKIE)?.value ?? null
}

/** Grava a sessao. So funciona em Server Action e Route Handler. */
export async function storeTokens(tokens: TokenPair): Promise<void> {
  const cookieStore = await cookies()
  const base = { httpOnly: true, secure: secureCookies(), sameSite: 'lax' as const, path: '/' }

  cookieStore.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...base,
    maxAge: Math.max(tokens.expiresIn - ACCESS_TOKEN_MARGIN, 30),
  })
  cookieStore.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...base,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  })
}

export async function markRefreshed(): Promise<void> {
  ;(await cookies()).set(REFRESHED_COOKIE, '1', {
    httpOnly: true,
    secure: secureCookies(),
    sameSite: 'lax',
    path: '/',
    maxAge: 15,
  })
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()

  for (const name of [ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, REFRESHED_COOKIE]) {
    cookieStore.delete(name)
  }
}

/**
 * Troca o refresh token por um novo par. Refresh tokens sao rotativos: o
 * anterior deixa de valer, entao o novo precisa ser gravado na mesma operacao.
 * Devolve `null` quando a sessao nao pode ser renovada.
 */
export async function refreshTokens(): Promise<TokenPair | null> {
  const refreshToken = await getRefreshToken()
  if (!refreshToken) {
    return null
  }

  try {
    const tokens = await apiFetch<TokenPair>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
      token: null,
    })
    await storeTokens(tokens)
    return tokens
  } catch {
    await clearSession()
    return null
  }
}

async function currentPath(): Promise<string> {
  return (await headers()).get(PATHNAME_HEADER) ?? '/dashboard'
}

/**
 * A API recusou o token durante uma renderizacao. Server Component nao grava
 * cookie, entao a renovacao acontece no Route Handler, que devolve a pessoa ao
 * mesmo lugar. Se a renovacao acabou de acontecer e a API ainda recusa, a
 * sessao nao tem conserto: volta ao login em vez de renovar em laco.
 */
export async function handleExpiredSession(): Promise<never> {
  const justRefreshed = (await cookies()).has(REFRESHED_COOKIE)

  if (justRefreshed) {
    redirect('/login?expired=1')
  }

  redirect(refreshPath(await currentPath()))
}

/**
 * Ponto unico de leitura da sessao.
 *
 * Confirma o token em `GET /auth/me` em vez de confiar no conteudo do cookie:
 * usuario inativado ou com sessoes invalidadas perde o acesso na proxima
 * navegacao. O `cache()` do React faz a confirmacao acontecer uma vez por
 * renderizacao, mesmo com layout e pagina pedindo o usuario.
 */
export const getSessionUser = cache(async (): Promise<SessionUser> => {
  const token = await getAccessToken()

  if (!token) {
    return handleExpiredSession()
  }

  let user: SessionUser
  try {
    user = await apiFetch<SessionUser>('/auth/me', { token })
  } catch (error) {
    if (isApiError(error) && error.status === 401) {
      return handleExpiredSession()
    }
    throw error
  }

  /*
   * Perfil que nao usa o painel -- trocado depois do login, por exemplo. Server
   * Component nao apaga cookie, entao a sessao e encerrada no Route Handler.
   */
  if (!canUsePanel(user.role)) {
    redirect(PANEL_DENIED_PATH)
  }

  return user
})
