'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { ASSIGNABLE_USER_ROLES, type UserRole } from '@/lib/domain/user'

/**
 * Entrada provisoria de desenvolvimento.
 *
 * O shell (issue #2) so e alcancavel com sessao, e a sessao de verdade chega na
 * issue #6, junto com a `backend#6`. Esta acao cria uma sessao local para que a
 * moldura possa ser vista e revisada antes disso -- exigencia de evidencia do
 * Definition of Done -- e desaparece quando o login existir.
 *
 * Nao ha token nenhum aqui: o cookie guarda apenas o perfil escolhido, para
 * demonstrar que o menu respeita a matriz do documento 5.2.
 */
export async function signInForDevelopment(formData: FormData): Promise<never> {
  const requested = formData.get('role')
  const role = ASSIGNABLE_USER_ROLES.find((value): value is UserRole => value === requested)

  if (!role) {
    redirect('/login')
  }

  const cookieStore = await cookies()

  cookieStore.set('fo_at', 'development', { httpOnly: true, sameSite: 'lax', path: '/' })
  cookieStore.set('fo_dev_role', role, { httpOnly: true, sameSite: 'lax', path: '/' })

  redirect('/dashboard')
}
