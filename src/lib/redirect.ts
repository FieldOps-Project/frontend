/**
 * Destino pos-login aceito somente quando e caminho da propria aplicacao.
 *
 * Aceitar URL arbitraria transforma o login em redirecionador aberto: um link
 * `/login?redirect=https://site-falso` levaria a pessoa, ja autenticada e
 * confiante, para fora do painel. `//host` e `/\host` sao tratados pelo
 * navegador como outra origem, por isso tambem sao recusados.
 */
export function safeRedirect(target: unknown, fallback = '/dashboard'): string {
  if (typeof target !== 'string' || !target.startsWith('/')) {
    return fallback
  }
  if (target.startsWith('//') || target.startsWith('/\\')) {
    return fallback
  }
  if (target.startsWith('/login') || target.startsWith('/api/')) {
    return fallback
  }
  return target
}
