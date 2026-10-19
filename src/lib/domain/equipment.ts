import type { StatusTone } from '@/lib/domain/page'

export const EQUIPMENT_STATUSES = ['ACTIVE', 'INACTIVE', 'DECOMMISSIONED'] as const

export type EquipmentStatus = (typeof EQUIPMENT_STATUSES)[number]

export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  DECOMMISSIONED: 'Baixado',
}

export const EQUIPMENT_STATUS_TONES: Record<EquipmentStatus, StatusTone> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
  DECOMMISSIONED: 'danger',
}

/**
 * Inativo e baixado sao situacoes diferentes e a tela precisa explicar: o
 * inativo pode voltar a operar, o baixado saiu de uso de vez.
 */
export const EQUIPMENT_STATUS_HINTS: Record<EquipmentStatus, string> = {
  ACTIVE: 'Disponível para novos agendamentos.',
  INACTIVE: 'Fora de operação temporariamente; pode ser reativado.',
  DECOMMISSIONED: 'Retirado de uso definitivamente.',
}

export type Equipment = {
  readonly id: string
  readonly siteId: string
  readonly name: string
  readonly assetNumber: string | null
  readonly serialNumber: string | null
  readonly manufacturer: string | null
  readonly model: string | null
  readonly description: string | null
  readonly qrCode: string
  readonly status: EquipmentStatus
  readonly installedAt: string | null
  readonly createdAt: string
  readonly updatedAt: string
  readonly version: number
}

/**
 * Valor de QR opaco e aleatorio. Nao codifica nada do equipamento: um QR que
 * carrega cliente e patrimonio vaza informacao para qualquer pessoa que aponte
 * a camera (RN-063).
 *
 * `getRandomValues`, e nao `randomUUID`: este roda tambem no navegador, e o
 * `randomUUID` so existe em contexto seguro -- abrir o painel por IP em HTTP
 * quebraria o botao de gerar.
 */
export function generateQrCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  const random = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase()
  return `EQP-${random}`
}
