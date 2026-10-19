/** Envelope de paginacao da API: pagina zero-based, tamanho maximo 100. */
export type Page<T> = {
  readonly content: readonly T[]
  readonly page: number
  readonly size: number
  readonly totalElements: number
  readonly totalPages: number
  readonly first: boolean
  readonly last: boolean
}

export const DEFAULT_PAGE_SIZE = 20

/** Limite da API. Seletores de formulario pedem tudo de uma vez ate esse teto. */
export const MAX_PAGE_SIZE = 100

/** Selo de situacao: o tom e apoio visual, o rotulo textual e a informacao. */
export type StatusTone = 'success' | 'neutral' | 'warning' | 'danger' | 'info'
