import type { StatusTone } from '@/lib/domain/page'

export const SITE_STATUSES = ['ACTIVE', 'INACTIVE'] as const

export type SiteStatus = (typeof SITE_STATUSES)[number]

export const SITE_STATUS_LABELS: Record<SiteStatus, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
}

export const SITE_STATUS_TONES: Record<SiteStatus, StatusTone> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
}

export type Site = {
  readonly id: string
  readonly clientId: string
  readonly name: string
  readonly description: string | null
  readonly addressLine: string | null
  readonly city: string | null
  readonly state: string | null
  readonly postalCode: string | null
  readonly latitude: number | null
  readonly longitude: number | null
  readonly contactName: string | null
  readonly contactPhone: string | null
  readonly status: SiteStatus
  readonly createdAt: string
  readonly updatedAt: string
  readonly version: number
}
