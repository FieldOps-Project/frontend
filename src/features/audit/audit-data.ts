import 'server-only'

import { demoAuditEvents } from '@/features/audit/audit-fixture'
import { loadActiveUsers } from '@/features/catalog/lookups'
import { paginate } from '@/features/inspections/list-data'
import { loadOptional } from '@/lib/dal'
import { auditActionLabel, AUDIT_ACTION_LABELS, periodStart, type AuditEvent, type AuditFilters } from '@/lib/domain/audit'
import { dayInSaoPaulo } from '@/lib/domain/inspection-list'
import { DEFAULT_PAGE_SIZE, type Page } from '@/lib/domain/page'

export type FilterOption = { readonly value: string; readonly label: string }

function usesDemo(): boolean {
  return process.env.NEXT_PUBLIC_APP_ENV === 'development'
}

export function isDemoAudit(): boolean {
  return usesDemo()
}

export function matchesAuditFilters(event: AuditEvent, filters: AuditFilters, today: string): boolean {
  const from = periodStart(filters.period, today)
  if (from && dayInSaoPaulo(event.occurredAt) < from) return false
  if (filters.actorId && event.actorId !== filters.actorId) return false
  if (filters.entityType && event.entityType !== filters.entityType) return false
  if (filters.action && event.action !== filters.action) return false
  if (filters.inspectionId && event.inspectionId !== filters.inspectionId) return false
  return true
}

/** Parametros de `GET /audit-events`: o periodo vira data inicial, como a API filtra. */
function apiQuery(filters: AuditFilters, today: string) {
  return {
    from: periodStart(filters.period, today) ?? undefined,
    actorId: filters.actorId,
    entityType: filters.entityType,
    action: filters.action,
    inspectionId: filters.inspectionId,
  }
}

/**
 * Pagina da auditoria (issue #24), do evento mais recente para o mais antigo,
 * paginada no servidor. Unico ponto de troca para a API (`GET /audit-events`);
 * sem ela, devolve `null` e a tela mostra a auditoria como indisponivel.
 */
export async function loadAuditPage(
  filters: AuditFilters,
  page: number,
  size: number = DEFAULT_PAGE_SIZE,
): Promise<Page<AuditEvent> | null> {
  const today = dayInSaoPaulo(new Date())
  if (usesDemo()) {
    return paginate(
      demoAuditEvents().filter((event) => matchesAuditFilters(event, filters, today)),
      page,
      size,
    )
  }
  return loadOptional<Page<AuditEvent>>('/audit-events', {
    ...apiQuery(filters, today),
    page,
    size,
    sort: 'occurredAt,desc',
  })
}

/** Opcoes dos seletores de usuario e de acao, coerentes com os dados mostrados. */
export async function loadAuditFilterOptions(): Promise<{
  readonly actors: readonly FilterOption[]
  readonly actions: readonly FilterOption[]
}> {
  const actions = Object.keys(AUDIT_ACTION_LABELS)
    .map((action) => ({ value: action, label: auditActionLabel(action) }))
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))

  if (usesDemo()) {
    const actors = new Map(
      demoAuditEvents().flatMap((event) => (event.actorId && event.actorName ? [[event.actorId, event.actorName] as const] : [])),
    )
    return {
      actors: [...actors].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')),
      actions,
    }
  }

  const users = await Promise.all([loadActiveUsers('ADMIN'), loadActiveUsers('SUPERVISOR'), loadActiveUsers('TECHNICIAN')])
  return {
    actors: users
      .flat()
      .map((user) => ({ value: user.id, label: user.name }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')),
    actions,
  }
}
