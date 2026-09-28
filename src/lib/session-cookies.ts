import 'server-only'

import { cookies } from 'next/headers'

/** Nomes dos cookies de sessao. `fo_at` e o mesmo que o `proxy.ts` procura. */
export const ACCESS_TOKEN_COOKIE = 'fo_at'
export const REFRESH_TOKEN_COOKIE = 'fo_rt'

/**
 * Validade do cookie do refresh token. A API nao a devolve no login; o valor
 * acompanha o `JWT_REFRESH_TOKEN_TTL` padrao do backend (P30D). Se o token
 * expirar antes, a API o recusa e a pessoa volta ao login -- o cookie so nao
 * pode sobreviver a ele por muito tempo.
 */
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30

/*
 * `httpOnly` tira o token do alcance do JavaScript da pagina; `sameSite: lax`
 * mitiga CSRF; `secure` e obrigatorio fora do ambiente local, onde o painel
 * roda em http.
 */
const baseOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
} as const

type SessionTokens = {
  readonly accessToken: string
  readonly refreshToken: string
  /** Validade do access token, em segundos. */
  readonly expiresIn: number
}

/**
 * Grava a sessao. O cookie do access token expira junto com o token, e assim o
 * `proxy.ts` manda a pessoa ao login assim que ele deixa de valer.
 */
export async function setSessionCookies({ accessToken, refreshToken, expiresIn }: SessionTokens) {
  const cookieStore = await cookies()

  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, { ...baseOptions, maxAge: expiresIn })
  cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...baseOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  })
}

export async function readAccessToken(): Promise<string | undefined> {
  return (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value
}

export async function readRefreshToken(): Promise<string | undefined> {
  return (await cookies()).get(REFRESH_TOKEN_COOKIE)?.value
}

/** Apaga a sessao local. So pode ser chamada em Server Action ou Route Handler. */
export async function clearSessionCookies() {
  const cookieStore = await cookies()

  cookieStore.delete(ACCESS_TOKEN_COOKIE)
  cookieStore.delete(REFRESH_TOKEN_COOKIE)
}
