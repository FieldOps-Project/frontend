import type { StatusTone } from '@/lib/domain/page'

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

/** Perfis que operam cadastros, modelos e agendamentos (matriz do documento 5.2). */
export const MANAGER_ROLES: readonly UserRole[] = ['ADMIN', 'SUPERVISOR']

/**
 * Quem usa o painel. A matriz do documento 5.2 deixa o tecnico como "opcional"
 * na interface administrativa e o cliente como "futuro"; o documento 14.1 define
 * o painel para administradores e supervisores. Pelo menor privilegio (5.3), os
 * demais perfis ficam de fora: o tecnico trabalha pelo aplicativo de campo.
 */
export function canUsePanel(role: UserRole): boolean {
  return MANAGER_ROLES.includes(role)
}

export function panelDeniedMessage(role: UserRole): string {
  return role === 'TECHNICIAN'
    ? 'O perfil Técnico não usa o painel administrativo. Acesse pelo aplicativo de campo.'
    : 'Seu perfil ainda não tem acesso ao painel administrativo.'
}

export const USER_STATUSES = ['ACTIVE', 'INACTIVE', 'BLOCKED'] as const

export type UserStatus = (typeof USER_STATUSES)[number]

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  BLOCKED: 'Bloqueado',
}

export const USER_STATUS_TONES: Record<UserStatus, StatusTone> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
  BLOCKED: 'danger',
}

export type User = {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly role: UserRole
  readonly status: UserStatus
  readonly phone: string | null
  readonly createdAt: string
  readonly updatedAt: string
  readonly version: number
}
