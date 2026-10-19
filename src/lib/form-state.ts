/**
 * Resultado das Server Actions de formulario, consumido por `useActionState`.
 *
 * `values` devolve o que a pessoa digitou: o React reinicia o formulario ao
 * fim da acao, e sem isso um erro de validacao apagaria tudo o que ja estava
 * preenchido.
 */
export type FormState =
  | { readonly status: 'idle' }
  | {
      readonly status: 'error'
      readonly message: string
      readonly fieldErrors: Readonly<Record<string, string>>
      readonly values: Readonly<Record<string, string>>
    }
  | { readonly status: 'success'; readonly message: string }

export const IDLE: FormState = { status: 'idle' }

/** Resultado das acoes de botao (mudar situacao, redefinir senha). */
export type ActionResult<T = undefined> =
  | { readonly ok: true; readonly message: string; readonly data?: T }
  | { readonly ok: false; readonly message: string }

export function valueOf(state: FormState, field: string, fallback: string | null | undefined): string {
  if (state.status === 'error' && field in state.values) {
    return state.values[field] ?? ''
  }
  return fallback ?? ''
}

export function errorOf(state: FormState, field: string): string | undefined {
  return state.status === 'error' ? state.fieldErrors[field] : undefined
}
