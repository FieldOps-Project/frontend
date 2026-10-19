/**
 * Filtros vivem na URL (documento 14, item 8.5): a tela vira link
 * compartilhavel, sobrevive ao recarregamento e o Server Component busca so a
 * pagina pedida.
 */
export type RawSearchParams = Record<string, string | string[] | undefined>

export function param(params: RawSearchParams, key: string): string | undefined {
  const value = params[key]
  const first = Array.isArray(value) ? value[0] : value
  return first && first.trim() !== '' ? first.trim() : undefined
}

export function pageParam(params: RawSearchParams): number {
  const page = Number(param(params, 'page') ?? 0)
  return Number.isInteger(page) && page >= 0 ? page : 0
}

/** Valor aceito somente se pertencer ao conjunto; filtro desconhecido e ignorado. */
export function oneOf<T extends string>(params: RawSearchParams, key: string, allowed: readonly T[]): T | undefined {
  const value = param(params, key)
  return value !== undefined && (allowed as readonly string[]).includes(value) ? (value as T) : undefined
}

export function withParams(pathname: string, params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value))
    }
  }

  const query = search.toString()
  return query ? `${pathname}?${query}` : pathname
}
