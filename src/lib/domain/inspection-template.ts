import type { StatusTone } from '@/lib/domain/page'

/**
 * Modelos de inspecao (documento 10.6, UC-04 e issue #13), no formato de
 * `GET /inspection-templates` (`InspectionTemplateResponse` da API).
 *
 * A situacao e a do modelo, nao a da versao: o modelo nasce `DRAFT`, vira
 * `ACTIVE` na primeira publicacao e so entao pode ser inativado (RN-022).
 */
export const TEMPLATE_STATUSES = ['DRAFT', 'ACTIVE', 'INACTIVE'] as const

export type TemplateStatus = (typeof TEMPLATE_STATUSES)[number]

export const TEMPLATE_STATUS_LABELS: Record<TemplateStatus, string> = {
  DRAFT: 'Rascunho',
  ACTIVE: 'Publicado',
  INACTIVE: 'Inativo',
}

export const TEMPLATE_STATUS_TONES: Record<TemplateStatus, StatusTone> = {
  DRAFT: 'warning',
  ACTIVE: 'success',
  INACTIVE: 'neutral',
}

export type InspectionTemplate = {
  readonly id: string
  readonly title: string
  readonly description: string | null
  readonly category: string
  readonly status: TemplateStatus
  /** Numero da versao publicada vigente; `null` enquanto nada foi publicado. */
  readonly currentVersion: number | null
  readonly createdBy: string | null
  readonly createdAt: string
  readonly updatedAt: string
  readonly version: number
}

/** Corpo de `POST /inspection-templates`: titulo e categoria obrigatorios (RN-015). */
export type NewTemplateInput = {
  readonly title: string
  readonly description: string | null
  readonly category: string
}

/** Limites de tamanho da API (`CreateInspectionTemplateRequest`). */
export const TEMPLATE_LIMITS = {
  title: 255,
  description: 1000,
  category: 100,
} as const

/** Filtros da listagem, os mesmos parametros de `GET /inspection-templates`. */
export type TemplateFilters = {
  readonly search?: string
  readonly status?: TemplateStatus
  readonly category?: string
}

export function isTemplateStatus(value: string): value is TemplateStatus {
  return (TEMPLATE_STATUSES as readonly string[]).includes(value)
}

/**
 * Situacao por extenso, com a versao vigente quando existe: "Rascunho",
 * "Publicado · versão 2", "Inativo · versão 3".
 */
export function templateSituation(template: Pick<InspectionTemplate, 'status' | 'currentVersion'>): string {
  const label = TEMPLATE_STATUS_LABELS[template.status]
  return template.currentVersion === null || template.status === 'DRAFT'
    ? label
    : `${label} · versão ${template.currentVersion}`
}

/**
 * A API so aceita mudar a situacao depois da primeira publicacao
 * (`422 TEMPLATE_NOT_PUBLISHED`): rascunho nunca publicado nao se inativa.
 */
export function canChangeTemplateStatus(template: Pick<InspectionTemplate, 'currentVersion'>): boolean {
  return template.currentVersion !== null
}
