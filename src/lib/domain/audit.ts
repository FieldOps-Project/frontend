import { HISTORY_ACTION_LABELS } from '@/lib/domain/inspection-detail'
import type { StatusTone } from '@/lib/domain/page'

/**
 * Evento de auditoria (documento 10.12.1 e issue #24), no formato que a area de
 * auditoria espera de `GET /audit-events` paginado. Os eventos sao somente
 * leitura (RN-088): o painel nao edita nem exclui nenhum.
 *
 * A API ainda nao publica a consulta (backend #29); este tipo e o contrato que
 * a tela pede ao backend.
 */
export const AUDIT_ENTITY_TYPES = [
  'INSPECTION',
  'EVIDENCE',
  'NON_CONFORMITY',
  'TEMPLATE',
  'CLIENT',
  'SITE',
  'EQUIPMENT',
  'USER',
  'REPORT',
] as const

export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number]

export const AUDIT_ENTITY_LABELS: Record<AuditEntityType, string> = {
  INSPECTION: 'Inspeção',
  EVIDENCE: 'Evidência',
  NON_CONFORMITY: 'Não conformidade',
  TEMPLATE: 'Modelo de inspeção',
  CLIENT: 'Cliente',
  SITE: 'Local',
  EQUIPMENT: 'Equipamento',
  USER: 'Usuário',
  REPORT: 'Relatório',
}

/** Acoes em linguagem de negocio: `INSPECTION_SUBMITTED` cru nao diz nada a quem le. */
export const AUDIT_ACTION_LABELS: Record<string, string> = {
  ...HISTORY_ACTION_LABELS,
  TEMPLATE_PUBLISHED: 'Versão de modelo publicada',
  RECORD_UPDATED: 'Edição de registro',
  USER_BLOCKED: 'Usuário bloqueado',
  REPORT_GENERATED: 'Relatório gerado',
}

export function auditActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action
}

/** Cor do selo da acao, como no Stitch: aprovacao azul, cancelamento vermelho, edicao cinza. */
export function auditActionTone(action: string): StatusTone {
  if (/CANCELED|REJECTED|BLOCKED|REMOVED/.test(action)) return 'danger'
  if (/APPROVED|PUBLISHED/.test(action)) return 'info'
  if (/NON_CONFORMITY/.test(action)) return 'warning'
  if (/SUBMITTED|COMPLETED|GENERATED/.test(action)) return 'success'
  return 'neutral'
}

export type AuditEvent = {
  readonly id: string
  /** Codigo de apresentacao, como `EVT-9042`. */
  readonly code: string
  readonly action: string
  /** Nulo quando a acao foi do sistema. */
  readonly actorId: string | null
  readonly actorName: string | null
  readonly entityType: AuditEntityType
  readonly entityId: string
  /** Como a entidade e reconhecida na tela, como `INS-2023-089`. */
  readonly entityLabel: string
  /** Inspecao relacionada, quando houver (`inspection_id`): foto e nao conformidade tambem tem. */
  readonly inspectionId: string | null
  /** Horario do servidor (RN-087). */
  readonly occurredAt: string
  /** Horario do dispositivo, quando a acao aconteceu no aplicativo (RN-074). */
  readonly deviceOccurredAt: string | null
  readonly description: string
}

/** Periodos do filtro, como o "Ultimos 7 dias" do Stitch. */
export const AUDIT_PERIODS = ['today', '7d', '30d', '90d', 'all'] as const
export type AuditPeriod = (typeof AUDIT_PERIODS)[number]

export const AUDIT_PERIOD_LABELS: Record<AuditPeriod, string> = {
  today: 'Hoje',
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  '90d': 'Últimos 90 dias',
  all: 'Todo o período',
}

export const DEFAULT_AUDIT_PERIOD: AuditPeriod = '7d'

export type AuditFilters = {
  readonly period: AuditPeriod
  readonly actorId?: string
  readonly entityType?: AuditEntityType
  readonly action?: string
  /** Eventos de uma inspecao so, como no link "Ver na auditoria" do detalhe dela. */
  readonly inspectionId?: string
}

const DAY_MS = 86_400_000

/** Inicio do periodo (`AAAA-MM-DD`, no fuso da operacao), ou nulo para todo o periodo. */
export function periodStart(period: AuditPeriod, today: string): string | null {
  const days = { today: 0, '7d': 6, '30d': 29, '90d': 89, all: null }[period]
  if (days === null) return null
  return new Date(Date.parse(`${today}T00:00:00Z`) - days * DAY_MS).toISOString().slice(0, 10)
}

/** Pagina do registro afetado, quando o painel tem uma. */
export function entityHref(event: Pick<AuditEvent, 'entityType' | 'entityId'>): string | null {
  switch (event.entityType) {
    case 'INSPECTION':
      return `/inspections/${event.entityId}`
    case 'NON_CONFORMITY':
      return `/non-conformities/${event.entityId}`
    case 'TEMPLATE':
      return `/inspection-templates/${event.entityId}`
    case 'CLIENT':
      return `/clients/${event.entityId}`
    case 'SITE':
      return `/sites/${event.entityId}`
    case 'EQUIPMENT':
      return `/equipment/${event.entityId}`
    case 'USER':
      return `/users/${event.entityId}`
    default:
      return null
  }
}
