'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

/** Cookies de sessao. O mesmo nome que o `proxy.ts` procura. */
const SESSION_COOKIES = ['fo_at', 'fo_rt'] as const

/**
 * Encerra a sessao e devolve a pessoa ao login.
 *
 * Apagar o cookie e a metade local do logout. A outra metade -- chamar
 * `POST /auth/logout` para revogar o refresh token no servidor -- entra com a
 * issue #6, quando existir sessao de verdade. Sem essa revogacao, um refresh
 * token copiado antes do logout continuaria valendo.
 */
export async function signOut(): Promise<never> {
  const cookieStore = await cookies()

  for (const name of SESSION_COOKIES) {
    cookieStore.delete(name)
  }

  redirect('/login')
}
