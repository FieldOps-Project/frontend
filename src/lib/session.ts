import 'server-only'

import { redirect } from 'next/navigation'
import { cache } from 'react'

import type { AuthUser } from '@/features/auth/contract'
import { apiFetch } from '@/lib/api/client'
import { ApiError } from '@/lib/api/errors'
import { readAccessToken } from '@/lib/session-cookies'

/**
 * Identidade minima que o shell precisa para se desenhar: quem esta na tela e
 * o que essa pessoa enxerga. Os campos sao os que a API devolve em
 * `GET /auth/me` e no corpo do login.
 */
export type SessionUser = AuthUser

/**
 * Ponto unico de leitura da sessao.
 *
 * Confirma o access token do cookie `httpOnly` em `GET /auth/me`, em vez de
 * confiar no que o cookie diz: a API e quem sabe se a conta continua ativa e
 * com o mesmo perfil. Sem token, ou com token recusado, a pessoa volta ao
 * login. O perfil Tecnico tambem volta, pela mesma regra que o login aplica.
 *
 * `cache()` do React faz a consulta uma vez por renderizacao, por mais que
 * layout e paginas a chamem. `import 'server-only'` faz o build falhar se um
 * componente de cliente importar este modulo, que e o que impede a sessao de
 * vazar para o navegador.
 */
export const getSessionUser = cache(async (): Promise<SessionUser> => {
  const accessToken = await readAccessToken()
  if (!accessToken) redirect('/login')

  let user: SessionUser
  try {
    user = await apiFetch<SessionUser>('/auth/me', { accessToken })
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect('/login')
    throw error
  }

  if (user.role === 'TECHNICIAN') redirect('/login')

  return user
})
