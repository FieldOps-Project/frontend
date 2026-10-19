/**
 * Nomes dos cookies de sessao. Ficam fora de `session.ts` porque o `proxy.ts`
 * tambem precisa deles, e `session.ts` e `server-only` e depende de
 * `next/headers`.
 */
export const ACCESS_TOKEN_COOKIE = 'fo_at'
export const REFRESH_TOKEN_COOKIE = 'fo_rt'

/** Cabecalho com o caminho atual, repassado pelo proxy aos Server Components. */
export const PATHNAME_HEADER = 'x-fo-pathname'

/** Rota que troca o refresh token por um novo par e devolve a pessoa ao destino. */
export function refreshPath(redirectTo: string): string {
  return `/api/auth/refresh?redirect=${encodeURIComponent(redirectTo)}`
}
