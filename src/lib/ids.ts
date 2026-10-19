const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Identificadores chegam as Server Actions vindos do navegador e viram parte do
 * caminho da API. Aceitar qualquer texto deixaria um `../users` montar outra
 * rota; so UUID passa.
 */
export function assertId(value: unknown): string {
  if (typeof value !== 'string' || !UUID.test(value)) {
    throw new Error('Identificador invalido.')
  }
  return value
}

export function isId(value: unknown): value is string {
  return typeof value === 'string' && UUID.test(value)
}
