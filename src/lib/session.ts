import 'server-only'

import { cookies } from 'next/headers'

import { USER_ROLES, type UserRole } from '@/lib/domain/user'

/**
 * Identidade minima que o shell precisa para se desenhar: quem esta na tela e
 * o que essa pessoa enxerga. Os campos sao os que o documento 12.4 devolve em
 * `GET /auth/me` e no corpo do login.
 */
export type SessionUser = {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly role: UserRole
}

/** Perfil escolhido na entrada provisoria de desenvolvimento. */
const DEVELOPMENT_ROLE_COOKIE = 'fo_dev_role'

function isUserRole(value: string | undefined): value is UserRole {
  return value !== undefined && (USER_ROLES as readonly string[]).includes(value)
}

/**
 * Ponto unico de leitura da sessao.
 *
 * Enquanto a issue #6 nao entrega o login e a `backend#6` nao entrega o JWT,
 * esta funcao monta a identidade a partir do perfil escolhido na entrada de
 * desenvolvimento -- e so ela sabe disso. Quando o login existir, o corpo passa
 * a ler o cookie `httpOnly` de sessao e a confirmar em `GET /auth/me`; nenhum
 * componente do shell muda, porque todos recebem o usuario ja pronto.
 *
 * `import 'server-only'` faz o build falhar se um componente de cliente tentar
 * importar este modulo, que e o que impede a sessao de vazar para o navegador.
 */
export async function getSessionUser(): Promise<SessionUser> {
  const cookieStore = await cookies()
  const chosen = cookieStore.get(DEVELOPMENT_ROLE_COOKIE)?.value
  const role: UserRole = isUserRole(chosen) ? chosen : 'ADMIN'

  return {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Usuário de desenvolvimento',
    email: 'dev@fieldops.local',
    role,
  }
}
