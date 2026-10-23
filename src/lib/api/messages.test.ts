import { describe, expect, it } from 'vitest'

import { ApiError } from '@/lib/api/errors'
import { fieldErrorsFor, messageFor } from '@/lib/api/messages'

/**
 * Item 11 dos testes prioritarios do documento 14.16: tratamento de erro da
 * API. A pessoa le linguagem de negocio, e o erro chega ao campo certo.
 */
describe('messageFor', () => {
  it('traduz codigo conhecido', () => {
    const error = new ApiError({ status: 401, code: 'AUTH_INVALID_CREDENTIALS', message: 'Invalid email or password' })

    expect(messageFor(error)).toBe('E-mail ou senha incorretos.')
  })

  it('trata qualquer *_NOT_FOUND como registro inexistente', () => {
    const error = new ApiError({ status: 404, code: 'CLIENT_NOT_FOUND', message: 'Client not found' })

    expect(messageFor(error)).toMatch(/não encontrado/)
  })

  it('nao expoe mensagem tecnica de erro interno', () => {
    const error = new ApiError({ status: 500, code: 'SOMETHING_ODD', message: 'NullPointerException' })

    expect(messageFor(error)).not.toContain('NullPointer')
  })
})

describe('fieldErrorsFor', () => {
  it('leva o 409 de e-mail duplicado para o campo de e-mail', () => {
    const error = new ApiError({ status: 409, code: 'EMAIL_ALREADY_EXISTS', message: 'exists' })

    expect(fieldErrorsFor(error)).toEqual({ email: 'Este e-mail já está cadastrado.' })
  })

  it('traduz as mensagens de validacao por campo', () => {
    const error = new ApiError({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'invalid',
      fieldErrors: [
        { field: 'name', message: 'must not be blank' },
        { field: 'email', message: 'must be a well-formed email address' },
      ],
    })

    expect(fieldErrorsFor(error)).toEqual({ name: 'Campo obrigatório.', email: 'Informe um e-mail válido.' })
  })
})

describe('erros do agendamento', () => {
  it('levam cliente e local inativos ao campo certo, com a mensagem do agendamento', () => {
    const client = new ApiError({ status: 422, code: 'CLIENT_INACTIVE', message: 'x' })
    const site = new ApiError({ status: 422, code: 'INSPECTION_SITE_INACTIVE', message: 'x' })

    expect(fieldErrorsFor(client)).toEqual({ clientId: 'O cliente está inativo e não pode receber novas inspeções.' })
    expect(fieldErrorsFor(site)).toEqual({ siteId: 'O local está inativo e não pode receber novas inspeções.' })
  })
})
