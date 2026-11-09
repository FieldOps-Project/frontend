/**
 * Resultado das acoes do construtor: a mensagem para o aviso de "salvo" e, na
 * recusa, os erros por campo, para o formulario aberto marcar o campo certo.
 */
export type BuilderResult<T = undefined> =
  | { readonly ok: true; readonly message: string; readonly data: T }
  | { readonly ok: false; readonly message: string; readonly fieldErrors: Readonly<Record<string, string>> }
