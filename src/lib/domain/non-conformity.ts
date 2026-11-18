import type { ReviewItem, ReviewPhoto, Severity } from '@/lib/domain/inspection-review'

/**
 * Nao conformidade (documento 10.10 e issue #20), com o contexto que a tela
 * mostra: a inspecao a que pertence (RN-052) e o item que a originou (RN-053).
 *
 * A API ainda nao publica `GET /non-conformities` nem `/{id}` (backend #23);
 * estes tipos sao o contrato que a tela pede ao backend.
 */

/** No MVP a nao conformidade e registrada e consultada, nao tratada: so existe `OPEN` (documento 14.12). */
export type NonConformityStatus = 'OPEN'

export const NON_CONFORMITY_STATUS_LABELS: Record<NonConformityStatus, string> = {
  OPEN: 'Aberta',
}

/** Linha da listagem geral (`GET /non-conformities`, paginado). */
export type NonConformityListItem = {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly severity: Severity
  readonly status: NonConformityStatus
  readonly inspectionId: string
  readonly inspectionCode: string
  readonly clientId: string
  readonly clientName: string
  readonly siteName: string
  readonly equipmentName: string | null
  /** Item do snapshot relacionado, quando houver (RN-053). */
  readonly itemCode: string | null
  readonly itemTitle: string | null
  readonly createdByName: string
  /** Horario de campo do registro (`created_at_device`). */
  readonly createdAtDevice: string
  readonly serverReceivedAt: string | null
}

/** Pergunta, resposta e observacao que originaram o achado. */
export type NonConformityOrigin = {
  readonly itemId: string
  readonly itemCode: string
  readonly question: string
  readonly responseType: ReviewItem['responseType']
  /** Resposta ja formatada para leitura, como `Não Conforme` ou `12,4 A`. */
  readonly answer: string | null
  readonly observation: string | null
}

/** Detalhe (`GET /non-conformities/{id}`): a linha, a origem e as evidencias. */
export type NonConformityDetail = NonConformityListItem & {
  readonly origin: NonConformityOrigin | null
  readonly evidences: readonly ReviewPhoto[]
}

/** Filtros da listagem, todos representados na URL. */
export type NonConformityFilters = {
  readonly severity?: Severity
  readonly clientId?: string
  /** Inicio e fim do periodo (`AAAA-MM-DD`), pela data de campo. */
  readonly from?: string
  readonly to?: string
}

/** Peso de cada criticidade: a ordem padrao e da mais grave para a menos grave. */
const SEVERITY_RANK: Record<Severity, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

/** Mais grave primeiro; na mesma criticidade, a mais recente primeiro. */
export function bySeverityDesc(a: NonConformityListItem, b: NonConformityListItem): number {
  return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || b.createdAtDevice.localeCompare(a.createdAtDevice)
}
