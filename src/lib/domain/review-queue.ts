import type { InspectionStatus } from '@/lib/domain/inspection'
import type { InspectionPriority } from '@/lib/domain/inspection-scheduling'

/**
 * Linha da fila de revisao (issue #21): inspecao enviada ou em revisao, com o
 * tempo de espera desde o envio e quem ja iniciou a revisao. Formato esperado
 * de `GET /inspections?review=true` ordenado por `submittedAtServer`.
 */
export type ReviewQueueItem = {
  readonly id: string
  readonly code: string
  readonly title: string
  readonly clientName: string
  readonly siteName: string
  readonly equipmentName: string | null
  readonly technicianName: string | null
  readonly supervisorName: string | null
  readonly priority: InspectionPriority
  readonly status: Extract<InspectionStatus, 'SUBMITTED' | 'UNDER_REVIEW'>
  /** Envio confirmado pelo servidor: o relogio da espera comeca aqui. */
  readonly submittedAtServer: string
  /** Quem iniciou a revisao, quando ja esta `UNDER_REVIEW`. */
  readonly reviewStartedByName: string | null
  readonly reviewStartedAt: string | null
}

/** Espera maior primeiro: quem foi enviada antes aparece no topo. */
export function byLongestWait(a: ReviewQueueItem, b: ReviewQueueItem): number {
  return a.submittedAtServer.localeCompare(b.submittedAtServer)
}

const RELATIVE = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'always' })

/** Tempo desde o envio em linguagem natural, como "há 2 dias" ou "há 3 horas". */
export function waitingLabel(since: string, now: Date = new Date()): string {
  const minutes = Math.max(Math.floor((now.getTime() - new Date(since).getTime()) / 60_000), 0)
  if (minutes < 1) return 'agora mesmo'
  if (minutes < 60) return RELATIVE.format(-minutes, 'minute')
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return RELATIVE.format(-hours, 'hour')
  return RELATIVE.format(-Math.floor(hours / 24), 'day')
}

/** Espera de mais de um dia ganha destaque: inspecao enviada nao deve ficar parada. */
export function isWaitingLong(since: string, now: Date = new Date()): boolean {
  return now.getTime() - new Date(since).getTime() > 24 * 60 * 60_000
}
