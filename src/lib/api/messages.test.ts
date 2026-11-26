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

  it('nunca mostra a mensagem tecnica de um codigo desconhecido', () => {
    const conflict = new ApiError({ status: 409, code: 'SOMETHING_NEW', message: 'Cannot do X in state Y' })
    expect(messageFor(conflict)).toBe(
      'Esta ação não é mais possível no estado atual do registro. Recarregue a página e tente de novo.',
    )
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

  it('leva o 409 de titulo de modelo repetido para o campo de titulo', () => {
    const error = new ApiError({ status: 409, code: 'TEMPLATE_TITLE_ALREADY_EXISTS', message: 'exists' })

    expect(fieldErrorsFor(error)).toEqual({ title: 'Já existe um modelo com este título.' })
  })

  it('leva a recusa das opcoes da escolha unica para o campo de opcoes', () => {
    const error = new ApiError({ status: 400, code: 'TEMPLATE_ITEM_OPTIONS_DUPLICATED', message: 'dup' })

    expect(fieldErrorsFor(error)).toEqual({ options: 'As opções da escolha única não podem se repetir.' })
  })

  it('leva as recusas do agendamento ao campo certo, com o motivo', () => {
    const cases = [
      ['TECHNICIAN_NOT_ELIGIBLE', 'technicianId', 'Somente técnico ativo pode receber a inspeção.'],
      ['TEMPLATE_VERSION_UNAVAILABLE', 'templateVersionId', 'Esta versão do modelo não está disponível para novas inspeções.'],
      ['EQUIPMENT_INACTIVE', 'equipmentId', 'O equipamento está inativo e não pode receber novas inspeções.'],
      ['SITE_CLIENT_MISMATCH', 'siteId', 'O local não pertence ao cliente selecionado.'],
      ['EQUIPMENT_SITE_MISMATCH', 'equipmentId', 'O equipamento não pertence ao local selecionado.'],
    ] as const
    for (const [code, field, message] of cases) {
      expect(fieldErrorsFor(new ApiError({ status: 422, code, message: 'technical' }))).toEqual({ [field]: message })
    }
  })

  it('nunca mostra a mensagem de campo em ingles que o painel nao conhece', () => {
    const error = new ApiError({
      status: 422,
      code: 'VALIDATION_ERROR',
      message: 'invalid',
      fieldErrors: [{ field: 'name', message: 'Something only the backend understands' }],
    })
    expect(fieldErrorsFor(error)).toEqual({ name: 'Valor não aceito. Revise este campo.' })
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

describe('fieldErrorsFor com regras da API', () => {
  it('prefere a mensagem do codigo conhecido ao texto em ingles do campo', () => {
    const error = new ApiError({
      status: 422,
      code: 'SITE_CLIENT_MISMATCH',
      message: 'x',
      fieldErrors: [{ field: 'siteId', message: 'Site must belong to clientId' }],
    })

    expect(fieldErrorsFor(error)).toEqual({ siteId: 'O local não pertence ao cliente selecionado.' })
  })

  it('traduz documento de cliente invalido', () => {
    const error = new ApiError({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'x',
      fieldErrors: [{ field: 'document', message: 'must be a CPF or CNPJ with a valid format' }],
    })

    expect(fieldErrorsFor(error)).toEqual({
      document: 'Documento inválido: informe um CPF (11 dígitos) ou CNPJ (14 dígitos).',
    })
  })

  it('pede no maximo N caracteres quando o minimo e zero', () => {
    const error = new ApiError({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'x',
      fieldErrors: [
        { field: 'name', message: 'size must be between 0 and 255' },
        { field: 'code', message: 'size must be between 1 and 50' },
      ],
    })

    expect(fieldErrorsFor(error)).toEqual({ name: 'Use no máximo 255 caracteres.', code: 'Use entre 1 e 50 caracteres.' })
  })

  it('junta os erros indexados de opcoes no campo de opcoes', () => {
    const error = new ApiError({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'x',
      fieldErrors: [
        { field: 'options[1]', message: 'must not be blank' },
        { field: 'options[3]', message: 'size must be between 0 and 100' },
      ],
    })

    expect(fieldErrorsFor(error)).toEqual({ options: 'Campo obrigatório.' })
  })

  it('leva a recusa do motivo de rejeicao ao campo do motivo', () => {
    const error = new ApiError({
      status: 422,
      code: 'INSPECTION_REJECTION_REASON_REQUIRED',
      message: 'x',
      fieldErrors: [{ field: 'reason', message: 'must not be blank' }],
    })

    expect(fieldErrorsFor(error)).toEqual({ reason: 'Informe o motivo da rejeição.' })
  })

  it('traduz os codigos novos do agendamento e dos modelos', () => {
    const cases = [
      ['INVALID_TECHNICIAN', 'technicianId'],
      ['INVALID_SUPERVISOR', 'supervisorId'],
      ['EQUIPMENT_REQUIRED', 'equipmentId'],
      ['SCHEDULED_FOR_REQUIRED', 'scheduledFor'],
    ] as const
    for (const [code, field] of cases) {
      const fields = fieldErrorsFor(new ApiError({ status: 422, code, message: 'technical' }))
      expect(Object.keys(fields)).toEqual([field])
      expect(fields[field]).not.toMatch(/Valor não aceito/)
    }
  })

  it.each([
    'INVALID_PERIOD',
    'INVALID_SORT',
    'INVALID_TEMPLATE_STATUS',
    'INSPECTION_NOT_EDITABLE',
    'INSPECTION_INVALID_TRANSITION',
    'INSPECTION_ITEM_NOT_IN_SNAPSHOT',
    'NON_CONFORMITY_STATUS_UNSUPPORTED',
    'TEMPLATE_VERSION_NOT_PUBLISHED',
    'TEMPLATE_ITEM_FAILURE_RULES_NOT_ALLOWED',
  ])('%s tem mensagem propria em portugues', (code) => {
    const message = messageFor(new ApiError({ status: 400, code, message: 'technical english' }))

    expect(message).not.toMatch(/technical english|Algum dado enviado/)
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
