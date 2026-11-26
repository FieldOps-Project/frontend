import { NETWORK_ERROR_CODE, type ApiError } from '@/lib/api/errors'

export const INACTIVE_ACCOUNT_MESSAGE = 'Sua conta está inativa ou bloqueada. Procure a administração do sistema.'

const CODE_MESSAGES: Record<string, string> = {
  AUTH_INVALID_CREDENTIALS: 'E-mail ou senha incorretos.',
  AUTH_USER_INACTIVE: INACTIVE_ACCOUNT_MESSAGE,
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
  INSPECTION_SITE_INACTIVE: 'O local está inativo e não pode receber novas inspeções.',
  INSPECTION_SITE_NOT_FOUND: 'O local escolhido não foi encontrado. Ele pode ter sido removido.',
  CLIENT_INACTIVE: 'O cliente está inativo e não pode receber novas inspeções.',
  INVALID_CLIENT_DOCUMENT: 'Documento inválido: informe um CPF (11 dígitos) ou CNPJ (14 dígitos).',
  INVALID_COORDINATES:
    'Coordenadas inválidas: informe latitude e longitude juntas, dentro dos limites permitidos.',
  INVALID_SORT: 'Ordenação inválida.',
  INVALID_PERIOD: 'O início do período não pode ser depois do fim.',
  INVALID_TEMPLATE_STATUS: 'Situação inválida: o modelo só pode ficar ativo ou inativo.',
  EXPORT_SCOPE_UNSUPPORTED: 'Seu perfil não pode exportar este tipo de dado.',
  METHOD_NOT_ALLOWED: 'Esta operação não é aceita pela API.',
  TEMPLATE_TITLE_ALREADY_EXISTS: 'Já existe um modelo com este título.',
  TEMPLATE_NOT_PUBLISHED: 'Publique o modelo antes de mudar a situação dele.',
  TEMPLATE_ITEM_RESPONSE_TYPE_REQUIRED: 'Escolha o tipo de resposta do item.',
  TEMPLATE_ITEM_FAILURE_RULES_NOT_ALLOWED:
    'Observação e evidência na falha só valem para itens de conformidade ou sim/não.',
  TEMPLATE_ITEM_OPTIONS_NOT_ALLOWED: 'Opções só valem para itens de escolha única.',
  TEMPLATE_ITEM_OPTIONS_REQUIRED: 'Informe ao menos 2 opções, sem deixar opção em branco.',
  TEMPLATE_ITEM_OPTIONS_DUPLICATED: 'As opções da escolha única não podem se repetir.',
  TEMPLATE_REORDER_MISMATCH: 'A ordem mudou em outra tela. Recarregue a página e tente de novo.',
  TEMPLATE_VERSION_PUBLISHED: 'Esta versão já foi publicada e não pode ser alterada.',
  TEMPLATE_VERSION_NOT_PUBLISHED: 'Só versões publicadas podem ser liberadas para novas inspeções.',
  TEMPLATE_PUBLISH_INVALID: 'O modelo tem pendências que impedem a publicação.',
  DATA_CONFLICT: 'Outra alteração foi salva ao mesmo tempo. Recarregue a página e tente de novo.',
  CONCURRENT_MODIFICATION: 'Outra alteração foi salva ao mesmo tempo. Recarregue a página e tente de novo.',
  TECHNICIAN_NOT_ELIGIBLE: 'Somente técnico ativo pode receber a inspeção.',
  INVALID_TECHNICIAN: 'Escolha um técnico ativo.',
  INVALID_SUPERVISOR: 'Escolha um supervisor ativo.',
  EQUIPMENT_REQUIRED: 'Este modelo exige um equipamento. Escolha o equipamento da inspeção.',
  SCHEDULED_FOR_REQUIRED: 'Informe a data prevista da inspeção.',
  TEMPLATE_VERSION_UNAVAILABLE: 'Esta versão do modelo não está disponível para novas inspeções.',
  EQUIPMENT_INACTIVE: 'O equipamento está inativo e não pode receber novas inspeções.',
  SITE_CLIENT_MISMATCH: 'O local não pertence ao cliente selecionado.',
  EQUIPMENT_SITE_MISMATCH: 'O equipamento não pertence ao local selecionado.',
  INSPECTION_INVALID_TRANSITION: 'Esta ação não é possível no estado atual da inspeção. Recarregue a página para ver o estado atualizado.',
  INSPECTION_NOT_EDITABLE: 'O planejamento não pode mais ser alterado: a execução já foi iniciada.',
  INSPECTION_CANCEL_REASON_REQUIRED: 'Informe o motivo do cancelamento.',
  INSPECTION_REJECTION_REASON_REQUIRED: 'Informe o motivo da rejeição.',
  INSPECTION_ITEM_NOT_IN_SNAPSHOT: 'Algum item selecionado não pertence a esta inspeção.',
  INSPECTION_APPROVED_READ_ONLY: 'Inspeção aprovada é somente leitura.',
  INSPECTION_RESPONSES_LOCKED: 'As respostas desta inspeção estão bloqueadas para edição.',
  EVIDENCE_READ_ONLY: 'Esta evidência é somente leitura.',
  NON_CONFORMITY_STATUS_UNSUPPORTED: 'Por enquanto só a situação “Aberta” está disponível para não conformidades.',
  [NETWORK_ERROR_CODE]: 'Não foi possível falar com a API. Verifique se ela está no ar e tente de novo.',
  INTERNAL_ERROR: 'A API encontrou um erro inesperado. Tente novamente em instantes.',
}

const CODE_FIELDS: Record<string, string> = {
  EMAIL_ALREADY_EXISTS: 'email',
  EQUIPMENT_QR_CODE_ALREADY_EXISTS: 'qrCode',
  INACTIVE_SITE: 'siteId',
  CLIENT_INACTIVE: 'clientId',
  INSPECTION_SITE_INACTIVE: 'siteId',
  INSPECTION_SITE_NOT_FOUND: 'siteId',
  INVALID_CLIENT_DOCUMENT: 'document',
  INVALID_COORDINATES: 'latitude',
  TEMPLATE_TITLE_ALREADY_EXISTS: 'title',
  TEMPLATE_ITEM_RESPONSE_TYPE_REQUIRED: 'responseType',
  TEMPLATE_ITEM_OPTIONS_REQUIRED: 'options',
  TEMPLATE_ITEM_OPTIONS_DUPLICATED: 'options',
  TEMPLATE_ITEM_OPTIONS_NOT_ALLOWED: 'options',
  TECHNICIAN_NOT_ELIGIBLE: 'technicianId',
  INVALID_TECHNICIAN: 'technicianId',
  INVALID_SUPERVISOR: 'supervisorId',
  EQUIPMENT_REQUIRED: 'equipmentId',
  SCHEDULED_FOR_REQUIRED: 'scheduledFor',
  INSPECTION_REJECTION_REASON_REQUIRED: 'reason',
  TEMPLATE_VERSION_UNAVAILABLE: 'templateVersionId',
  EQUIPMENT_INACTIVE: 'equipmentId',
  SITE_CLIENT_MISMATCH: 'siteId',
  EQUIPMENT_SITE_MISMATCH: 'equipmentId',
}

const FIELD_MESSAGE_PATTERNS: readonly (readonly [RegExp, (match: RegExpMatchArray) => string])[] = [
  [/must not be (blank|null|empty)/i, () => 'Campo obrigatório.'],
  [/well-formed email/i, () => 'Informe um e-mail válido.'],
  [/size must be between 0 and (\d+)/i, (m) => `Use no máximo ${m[1]} caracteres.`],
  [/size must be between (\d+) and (\d+)/i, (m) => `Use entre ${m[1]} e ${m[2]} caracteres.`],
  [/must be a CPF or CNPJ/i, () => 'Documento inválido: informe um CPF (11 dígitos) ou CNPJ (14 dígitos).'],
  [/must be greater than or equal to (-?[\d.]+)/i, (m) => `O valor mínimo é ${m[1]}.`],
  [/must be less than or equal to (-?[\d.]+)/i, (m) => `O valor máximo é ${m[1]}.`],
]

const UNKNOWN_FIELD_MESSAGE = 'Valor não aceito. Revise este campo.'

export function translateFieldMessage(message: string): string {
  for (const [pattern, render] of FIELD_MESSAGE_PATTERNS) {
    const match = message.match(pattern)
    if (match) {
      return render(match)
    }
  }
  return UNKNOWN_FIELD_MESSAGE
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
  return STATUS_MESSAGES[error.status] ?? 'Não foi possível concluir a ação. Tente novamente.'
}

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Algum dado enviado não foi aceito. Revise e tente de novo.',
  401: 'Sua sessão expirou. Entre novamente.',
  403: 'Seu perfil não tem permissão para esta ação.',
  409: 'Esta ação não é mais possível no estado atual do registro. Recarregue a página e tente de novo.',
  422: 'Algum dado enviado não foi aceito. Revise e tente de novo.',
}

function collapseIndexes(field: string): string {
  return field.replace(/\[\d+\]/g, '')
}

export function fieldErrorsFor(error: ApiError): Record<string, string> {
  const fields: Record<string, string> = {}

  const codeField = CODE_FIELDS[error.code]
  if (codeField) {
    fields[codeField] = messageFor(error)
  }

  for (const item of error.fieldErrors) {
    fields[collapseIndexes(item.field)] ??= translateFieldMessage(item.message)
  }

  return fields
}
