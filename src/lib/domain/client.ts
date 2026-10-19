import type { StatusTone } from '@/lib/domain/page'

export const CLIENT_STATUSES = ['ACTIVE', 'INACTIVE'] as const

export type ClientStatus = (typeof CLIENT_STATUSES)[number]

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
}

export const CLIENT_STATUS_TONES: Record<ClientStatus, StatusTone> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
}

export type Client = {
  readonly id: string
  readonly name: string
  readonly legalName: string | null
  readonly document: string | null
  readonly email: string | null
  readonly phone: string | null
  readonly status: ClientStatus
  readonly createdAt: string
  readonly updatedAt: string
  readonly version: number
}

/** A API grava o documento so com digitos; a tela devolve a mascara de CPF ou CNPJ. */
export function formatDocument(document: string | null): string {
  if (!document) return ''
  if (document.length === 11) {
    return document.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  if (document.length === 14) {
    return document.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  return document
}
