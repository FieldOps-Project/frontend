import { AUTH_ERROR_CODES } from '@/features/auth/contract'
import { ApiError, ApiUnavailableError } from '@/lib/api/errors'

export const AUTH_MESSAGES = {
  invalidCredentials: 'E-mail ou senha incorretos.',
  inactiveUser: 'Sua conta está inativa ou bloqueada. Procure a administração.',
  technicianNotAllowed:
    'O perfil Técnico não usa o painel administrativo. Acesse pelo aplicativo de campo.',
  invalidInput: 'Revise os campos destacados.',
  unavailable: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
  unexpected: 'Não foi possível entrar agora. Tente novamente em instantes.',
} as const

/**
 * Traduz a falha do login para a mensagem que a pessoa le.
 *
 * Credencial invalida e e-mail inexistente chegam com o mesmo codigo e mostram
 * a mesma frase -- distinguir as duas diria a quem tenta adivinhar quais
 * e-mails existem. Conta inativa tem orientacao propria, como pede o documento
 * 17.2. O texto em ingles da API nunca chega a tela.
 */
export function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiUnavailableError) return AUTH_MESSAGES.unavailable

  if (error instanceof ApiError) {
    if (error.code === AUTH_ERROR_CODES.invalidCredentials) return AUTH_MESSAGES.invalidCredentials
    if (error.code === AUTH_ERROR_CODES.inactiveUser) return AUTH_MESSAGES.inactiveUser
    if (error.status === 400) return AUTH_MESSAGES.invalidInput
    if (error.status === 401) return AUTH_MESSAGES.invalidCredentials
  }

  return AUTH_MESSAGES.unexpected
}
