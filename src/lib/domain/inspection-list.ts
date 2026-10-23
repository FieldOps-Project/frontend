import type { InspectionStatus } from '@/lib/domain/inspection'
import type { InspectionPriority } from '@/lib/domain/inspection-scheduling'

/**
 * Linha do acompanhamento de inspecoes (documento 14.10 e issue #17): as colunas
 * que a tela mostra, no formato que ela espera receber de `GET /inspections`
 * paginado.
 */
export type InspectionListItem = {
  readonly id: string
  /** Codigo de apresentacao, como `INS-2023-089`. */
  readonly code: string
  readonly title: string
  readonly clientId: string
  readonly clientName: string
  readonly siteName: string
  readonly equipmentName: string | null
  readonly technicianId: string | null
  readonly technicianName: string | null
  readonly priority: InspectionPriority
  readonly status: InspectionStatus
  readonly scheduledFor: string
  /** Progresso: itens respondidos sobre itens aplicaveis (RN-040). */
  readonly answeredItems: number
  readonly applicableItems: number
  readonly updatedAt: string
}

/** Filtros da listagem, todos representados na URL. */
export type InspectionFilters = {
  readonly q?: string
  readonly status?: InspectionStatus
  readonly technicianId?: string
  readonly clientId?: string
  readonly priority?: InspectionPriority
  /** Data prevista (`AAAA-MM-DD`). */
  readonly date?: string
  readonly overdue?: boolean
  readonly review?: boolean
}

/** Recorte "aguardando revisao": enviada ou ja em revisao. */
export const AWAITING_REVIEW: readonly InspectionStatus[] = ['SUBMITTED', 'UNDER_REVIEW']

/** Estados em que a inspecao ainda depende do tecnico e, portanto, pode atrasar. */
const OPEN_FOR_EXECUTION: readonly InspectionStatus[] = ['ASSIGNED', 'IN_PROGRESS', 'REJECTED']

const DAY_MS = 86_400_000
const TIME_ZONE = 'America/Sao_Paulo'

/** Dia (`AAAA-MM-DD`) de um instante no fuso da operacao. */
export function dayInSaoPaulo(value: string | Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(new Date(value))
}

function daysBetween(fromDay: string, toDay: string): number {
  return Math.round((Date.parse(`${toDay}T00:00:00Z`) - Date.parse(`${fromDay}T00:00:00Z`)) / DAY_MS)
}

/** Dias de atraso; zero quando a inspecao nao esta atrasada. Calculado, nao armazenado. */
export function daysOverdue(item: Pick<InspectionListItem, 'status' | 'scheduledFor'>, today: string): number {
  if (!OPEN_FOR_EXECUTION.includes(item.status)) return 0
  return Math.max(daysBetween(dayInSaoPaulo(item.scheduledFor), today), 0)
}

export function isOverdue(item: Pick<InspectionListItem, 'status' | 'scheduledFor'>, today: string): boolean {
  return daysOverdue(item, today) > 0
}

export function isAwaitingReview(item: Pick<InspectionListItem, 'status'>): boolean {
  return AWAITING_REVIEW.includes(item.status)
}

export function progressPercent(item: Pick<InspectionListItem, 'answeredItems' | 'applicableItems'>): number {
  if (item.applicableItems <= 0) return 0
  return Math.min(100, Math.round((item.answeredItems / item.applicableItems) * 100))
}

const TIME = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TIME_ZONE })

/**
 * Complemento da data prevista: atraso, hoje com horario ou quanto falta. Some
 * quando a inspecao ja saiu das maos do tecnico e a data ficou no passado.
 */
export function dueLabel(item: Pick<InspectionListItem, 'status' | 'scheduledFor'>, today: string): string | null {
  const late = daysOverdue(item, today)
  if (late > 0) return `Atrasado (${late} ${late === 1 ? 'dia' : 'dias'})`

  const ahead = daysBetween(today, dayInSaoPaulo(item.scheduledFor))
  if (ahead === 0) return `Hoje, ${TIME.format(new Date(item.scheduledFor))}`
  if (ahead === 1) return 'Amanhã'
  if (ahead > 1) return `Em ${ahead} dias`
  return null
}

/** Iniciais para o avatar do tecnico, como `CS` para Carlos Silva. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return `${first}${last}`.toUpperCase()
}
