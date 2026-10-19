import { NETWORK_ERROR_CODE, type ApiError } from '@/lib/api/errors'

/**
 * Traducao dos codigos da API para linguagem de negocio (documento 14, item
 * 8.3). O usuario le "Este e-mail ja esta cadastrado", nunca
 * `EMAIL_ALREADY_EXISTS` nem "Request failed with status code 409".
 */
const CODE_MESSAGES: Record<string, string> = {
  AUTH_INVALID_CREDENTIALS: 'E-mail ou senha incorretos.',
  AUTH_USER_INACTIVE: 'Sua conta está inativa ou bloqueada. Procure a administração do sistema.',
  AUTH_INVALID_REFRESH_TOKEN: 'Sua sessão expirou. Entre novamente.',
  AUTH_INVALID_TOKEN: 'Sua sessão expirou. Entre novamente.',
  AUTH_AUTHENTICATION_REQUIRED: 'Sua sessão expirou. Entre novamente.',
  AUTH_FORBIDDEN: 'Seu perfil não tem permissão para esta ação.',
  VALIDATION_ERROR: 'Revise os campos destacados.',
  INVALID_REQUEST: 'Algum dado enviado está em formato inválido.',
  EMAIL_ALREADY_EXISTS: 'Este e-mail já está cadastrado.',
  EQUIPMENT_QR_CODE_ALREADY_EXISTS: 'Este QR Code já está em uso por outro equipamento.',
  INVALID_QR_CODE: 'Informe um QR Code.',
  EQUIPMENT_NOT_FOUND: 'Nenhum equipamento encontrado com este QR Code.',
  INACTIVE_SITE: 'O local está inativo e não aceita novos equipamentos.',
  INSPECTION_SITE_INACTIVE: 'O local está inativo.',
  CLIENT_INACTIVE: 'O cliente está inativo e não aceita novos locais.',
  INVALID_CLIENT_DOCUMENT: 'Documento inválido: informe um CPF (11 dígitos) ou CNPJ (14 dígitos).',
  INVALID_COORDINATES:
    'Coordenadas inválidas: informe latitude e longitude juntas, dentro dos limites permitidos.',
  INVALID_SORT: 'Ordenação inválida.',
  [NETWORK_ERROR_CODE]: 'Não foi possível falar com a API. Verifique se ela está no ar e tente de novo.',
  INTERNAL_ERROR: 'A API encontrou um erro inesperado. Tente novamente em instantes.',
}

/**
 * Erros de regra que a API devolve sem `fieldErrors`, mas que pertencem a um
 * campo especifico. O 409 de e-mail duplicado precisa aparecer no campo de
 * e-mail, e o QR duplicado no campo do QR.
 */
const CODE_FIELDS: Record<string, string> = {
  EMAIL_ALREADY_EXISTS: 'email',
  EQUIPMENT_QR_CODE_ALREADY_EXISTS: 'qrCode',
  INACTIVE_SITE: 'siteId',
  CLIENT_INACTIVE: 'clientId',
  INVALID_CLIENT_DOCUMENT: 'document',
  INVALID_COORDINATES: 'latitude',
}

/** Mensagens do Bean Validation, que a API devolve em ingles. */
const FIELD_MESSAGE_PATTERNS: readonly (readonly [RegExp, (match: RegExpMatchArray) => string])[] = [
  [/must not be (blank|null|empty)/i, () => 'Campo obrigatório.'],
  [/well-formed email/i, () => 'Informe um e-mail válido.'],
  [/size must be between (\d+) and (\d+)/i, (m) => `Use entre ${m[1]} e ${m[2]} caracteres.`],
  [/must be greater than or equal to (-?[\d.]+)/i, (m) => `O valor mínimo é ${m[1]}.`],
  [/must be less than or equal to (-?[\d.]+)/i, (m) => `O valor máximo é ${m[1]}.`],
]

export function translateFieldMessage(message: string): string {
  for (const [pattern, render] of FIELD_MESSAGE_PATTERNS) {
    const match = message.match(pattern)
    if (match) {
      return render(match)
    }
  }
  return message
}

export function messageFor(error: ApiError): string {
  const known = CODE_MESSAGES[error.code]
  if (known) {
    return known
  }
  if (error.code.endsWith('_NOT_FOUND')) {
    return 'Registro não encontrado. Ele pode ter sido removido.'
  }
  if (error.status >= 500) {
    return CODE_MESSAGES.INTERNAL_ERROR as string
  }
  return error.message
}

export function fieldErrorsFor(error: ApiError): Record<string, string> {
  const fields: Record<string, string> = {}

  for (const item of error.fieldErrors) {
    fields[item.field] ??= translateFieldMessage(item.message)
  }

  const codeField = CODE_FIELDS[error.code]
  if (codeField && !fields[codeField]) {
    fields[codeField] = messageFor(error)
  }

  return fields
}
