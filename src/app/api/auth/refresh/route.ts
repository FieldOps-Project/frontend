import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'

import { safeRedirect } from '@/lib/redirect'
import { markRefreshed, refreshTokens } from '@/lib/session'

/**
 * Renovacao da sessao.
 *
 * Server Component nao grava cookie, entao quem precisa renovar durante uma
 * navegacao passa por aqui: o refresh token vira um novo par, os cookies sao
 * regravados e a pessoa volta ao destino. Se a renovacao falhar, a sessao
 * acabou de verdade e o caminho e o login, com o destino preservado.
 */
export async function GET(request: NextRequest): Promise<never> {
  const destination = safeRedirect(request.nextUrl.searchParams.get('redirect'))
  const tokens = await refreshTokens()

  if (!tokens) {
    redirect(`/login?expired=1&redirect=${encodeURIComponent(destination)}`)
  }

  await markRefreshed()
  redirect(destination)
}
