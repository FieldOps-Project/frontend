/** Para onde vai quem entra sem destino pretendido. */
export const DEFAULT_REDIRECT_TARGET = '/dashboard'

/**
 * Destino pos-login a partir do `?redirect=` que o `proxy.ts` anexa.
 *
 * So aceita caminho da propria aplicacao. Aceitar qualquer valor transforma o
 * login num redirecionador aberto: um link `/login?redirect=https://golpe.com`
 * levaria a pessoa, recem-autenticada e confiante, para fora do painel. Por
 * isso ficam de fora URL absoluta, `//host` e `/\host` -- os dois ultimos o
 * navegador interpreta como outro dominio -- e o proprio `/login`, que criaria
 * um laco.
 */
export function safeRedirectTarget(value: unknown): string {
  if (typeof value !== 'string') return DEFAULT_REDIRECT_TARGET

  const target = value.trim()

  if (!target.startsWith('/')) return DEFAULT_REDIRECT_TARGET
  if (target.startsWith('//') || target.startsWith('/\\')) return DEFAULT_REDIRECT_TARGET
  if (/[\u0000-\u001f]/.test(target)) return DEFAULT_REDIRECT_TARGET
  if (target === '/login' || target.startsWith('/login?') || target.startsWith('/login/')) {
    return DEFAULT_REDIRECT_TARGET
  }

  return target
}
