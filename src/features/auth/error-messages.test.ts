import { describe, expect, it } from 'vitest'

import { AUTH_MESSAGES, loginErrorMessage } from '@/features/auth/error-messages'
import { ApiError, ApiUnavailableError } from '@/lib/api/errors'

function apiError(status: number, code: string) {
  return new ApiError({ status, code, message: 'backend message in english' })
}

describe('loginErrorMessage', () => {
  it('nao revela se o e-mail existe quando a credencial e invalida', () => {
    expect(loginErrorMessage(apiError(401, 'AUTH_INVALID_CREDENTIALS'))).toBe(
      AUTH_MESSAGES.invalidCredentials,
    )
  })

  it('orienta a procurar a administracao quando a conta esta inativa', () => {
    expect(loginErrorMessage(apiError(401, 'AUTH_USER_INACTIVE'))).toBe(AUTH_MESSAGES.inactiveUser)
  })

  it('pede para revisar os campos quando a API recusa a validacao', () => {
    expect(loginErrorMessage(apiError(400, 'VALIDATION_ERROR'))).toBe(AUTH_MESSAGES.invalidInput)
  })

  it('orienta a tentar de novo quando a API nao responde', () => {
    expect(loginErrorMessage(new ApiUnavailableError(new TypeError('fetch failed')))).toBe(
      AUTH_MESSAGES.unavailable,
    )
  })

  it('nunca mostra o texto em ingles da API', () => {
    const message = loginErrorMessage(apiError(500, 'INTERNAL_ERROR'))

    expect(message).toBe(AUTH_MESSAGES.unexpected)
    expect(message).not.toContain('backend')
  })
})
