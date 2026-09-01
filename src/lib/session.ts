import 'server-only'

import type { UserRole } from '@/lib/domain/user'

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

/**
 * Ponto unico de leitura da sessao.
 *
 * Enquanto a issue #6 nao entrega o login e a `backend#6` nao entrega o JWT,
 * esta funcao devolve uma identidade fixa de desenvolvimento -- e so ela sabe
 * disso. Quando o login existir, o corpo passa a ler o cookie `httpOnly` e a
 * confirmar a sessao em `GET /auth/me`; nenhum componente do shell muda, porque
 * todos recebem o usuario ja pronto.
 *
 * `import 'server-only'` faz o build falhar se algum componente de cliente
 * tentar importar este modulo, que e o que impede a sessao de vazar para o
 * navegador.
 */
export async function getSessionUser(): Promise<SessionUser> {
  return {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Usuário de desenvolvimento',
    email: 'dev@fieldops.local',
    role: 'ADMIN',
  }
}
