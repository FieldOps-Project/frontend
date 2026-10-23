/**
 * Validacao do formulario de acesso, a mesma no navegador e na Server Action.
 *
 * Roda no navegador para retorno imediato e de novo no servidor, porque a
 * Server Action e um ponto de entrada publico. Os limites sao os do
 * `LoginRequest` da API -- e-mail valido de ate 320 caracteres, senha de ate
 * 128 -- para que o formulario nunca aceite algo que o backend recusaria.
 */
export type LoginField = 'email' | 'password'

export type LoginFieldErrors = Partial<Record<LoginField, string>>

export const EMAIL_MAX_LENGTH = 320
export const PASSWORD_MAX_LENGTH = 128

/** Mesmo criterio pratico do navegador: algo@dominio.tld, sem espacos. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateLogin(values: { email: unknown; password: unknown }): LoginFieldErrors {
  const errors: LoginFieldErrors = {}
  const email = typeof values.email === 'string' ? values.email.trim() : ''
  const password = typeof values.password === 'string' ? values.password : ''

  if (email === '') {
    errors.email = 'Informe o e-mail.'
  } else if (email.length > EMAIL_MAX_LENGTH) {
    errors.email = `O e-mail deve ter no máximo ${EMAIL_MAX_LENGTH} caracteres.`
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Informe um e-mail válido.'
  }

  if (password === '') {
    errors.password = 'Informe a senha.'
  } else if (password.length > PASSWORD_MAX_LENGTH) {
    errors.password = `A senha deve ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`
  }

  return errors
}

export function hasLoginErrors(errors: LoginFieldErrors): boolean {
  return Boolean(errors.email || errors.password)
}
