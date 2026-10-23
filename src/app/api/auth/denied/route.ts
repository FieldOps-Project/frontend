import { redirect } from 'next/navigation'

import { apiFetch } from '@/lib/api/client'
import { canUsePanel } from '@/lib/domain/user'
import { clearSession, getAccessToken, getRefreshToken, type SessionUser } from '@/lib/session'

/**
 * Encerra a sessao de um perfil que nao usa o painel.
 *
 * `getSessionUser()` manda para ca quem tem sessao valida mas perfil fora do
 * painel -- alguem que virou tecnico depois de entrar, por exemplo. Server
 * Component nao apaga cookie, entao a saida acontece neste Route Handler:
 * revoga o refresh token na API, apaga os cookies e leva ao login com o aviso.
 *
 * Antes de sair, confirma o perfil na API: um link para esta rota nao pode
 * derrubar a sessao de um administrador ou supervisor.
 */
export async function GET(): Promise<never> {
  const token = await getAccessToken()

  if (token) {
    const user = await apiFetch<SessionUser>('/auth/me', { token }).catch(() => null)
    if (user && canUsePanel(user.role)) {
      redirect('/dashboard')
    }
  }

  const refreshToken = await getRefreshToken()
  if (refreshToken) {
    await apiFetch('/auth/logout', { method: 'POST', body: { refreshToken }, token: null }).catch(() => undefined)
  }

  await clearSession()
  redirect('/login?denied=1')
}
