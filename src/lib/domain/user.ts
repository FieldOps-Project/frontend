/**
 * Perfis e situacoes do usuario, com os rotulos que a interface exibe.
 *
 * Os valores sao os do documento 10 e do documento 5.2, e sao os mesmos que a
 * migracao `V2__create_users.sql` da API grava na coluna `role`. Os rotulos
 * ficam centralizados aqui porque tela que traduz enum por conta propria
 * termina com "Tecnico" em uma e "Técnico" em outra.
 */
export const USER_ROLES = ['ADMIN', 'SUPERVISOR', 'TECHNICIAN', 'CLIENT_VIEWER'] as const

export type UserRole = (typeof USER_ROLES)[number]

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  SUPERVISOR: 'Supervisor',
  TECHNICIAN: 'Técnico',
  CLIENT_VIEWER: 'Cliente (somente leitura)',
}

/**
 * Perfis oferecidos no cadastro de usuario. O `CLIENT_VIEWER` existe no
 * contrato e precisa ser aceito quando a API o devolver, mas o documento 5.1 o
 * marca como futuro: oferece-lo no formulario criaria contas sem tela para
 * usar.
 */
export const ASSIGNABLE_USER_ROLES: readonly UserRole[] = ['ADMIN', 'SUPERVISOR', 'TECHNICIAN']

export const USER_STATUSES = ['ACTIVE', 'INACTIVE', 'BLOCKED'] as const

export type UserStatus = (typeof USER_STATUSES)[number]

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  BLOCKED: 'Bloqueado',
}
