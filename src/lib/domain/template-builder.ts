import type { InspectionTemplate } from '@/lib/domain/inspection-template'

/**
 * Construtor de modelo (issue #14, documento 14.8): secoes, itens e tipos de
 * resposta, no formato de `GET /inspection-templates/{id}`
 * (`InspectionTemplateDetailResponse` da API).
 *
 * O construtor sempre edita o rascunho do modelo (ADR-001); publicar copia o
 * rascunho para uma versao numerada e imutavel, entao editar nunca altera o
 * que as inspecoes ja receberam.
 */
export const RESPONSE_TYPES = [
  'TEXT_SHORT',
  'TEXT_LONG',
  'NUMBER',
  'BOOLEAN',
  'CONFORMITY',
  'SINGLE_CHOICE',
  'DATE',
] as const

export type ResponseType = (typeof RESPONSE_TYPES)[number]

export const RESPONSE_TYPE_LABELS: Record<ResponseType, string> = {
  TEXT_SHORT: 'Texto curto',
  TEXT_LONG: 'Texto longo',
  NUMBER: 'Numérico',
  BOOLEAN: 'Sim/Não',
  CONFORMITY: 'Conformidade',
  SINGLE_CHOICE: 'Escolha única',
  DATE: 'Data',
}

export type TemplateItem = {
  readonly id: string
  readonly sectionId: string
  readonly code: string | null
  readonly title: string
  /** Instrucao adicional mostrada ao tecnico. */
  readonly description: string | null
  readonly responseType: ResponseType
  readonly required: boolean
  readonly observationRequiredOnFailure: boolean
  readonly evidenceRequiredOnFailure: boolean
  /** Opcoes de `SINGLE_CHOICE`; vazia nos demais tipos. */
  readonly options: readonly string[]
  readonly displayOrder: number
}

export type TemplateSection = {
  readonly id: string
  readonly title: string
  readonly description: string | null
  readonly displayOrder: number
  readonly items: readonly TemplateItem[]
}

export type InspectionTemplateDetail = InspectionTemplate & {
  readonly draftVersionId: string | null
  readonly sections: readonly TemplateSection[]
}

/** Versao publicada (`TemplateVersionSummaryResponse`). */
export type TemplateVersionSummary = {
  readonly id: string
  readonly templateId: string
  readonly versionNumber: number
  readonly title: string
  readonly publishedBy: string | null
  readonly publishedAt: string
  readonly activeForNewInspections: boolean
}

/** Corpo de criacao e edicao de secao. */
export type SectionInput = {
  readonly title: string
  readonly description: string | null
}

/** Corpo de criacao e edicao de item. */
export type ItemInput = {
  readonly title: string
  readonly description: string | null
  readonly responseType: ResponseType
  readonly required: boolean
  readonly observationRequiredOnFailure: boolean
  readonly evidenceRequiredOnFailure: boolean
  readonly options: readonly string[]
}

/** Limites da API (`CreateTemplateSectionRequest` e `CreateTemplateItemRequest`). */
export const BUILDER_LIMITS = {
  sectionTitle: 255,
  sectionDescription: 1000,
  itemTitle: 255,
  itemDescription: 1000,
  options: 50,
  option: 100,
} as const

/** `SINGLE_CHOICE` exige ao menos duas opcoes (RN-016). */
export const MIN_CHOICE_OPTIONS = 2

export function isResponseType(value: string): value is ResponseType {
  return (RESPONSE_TYPES as readonly string[]).includes(value)
}

/**
 * Observacao e evidencia na falha so valem para conformidade e sim/nao: sao os
 * tipos com resposta de falha ("Não conforme", ou "Não", que o aplicativo
 * grava como nao conforme). A API recusa nos demais
 * (`TEMPLATE_ITEM_FAILURE_RULES_NOT_ALLOWED`).
 */
export function supportsFailureRules(type: ResponseType): boolean {
  return type === 'CONFORMITY' || type === 'BOOLEAN'
}

/** Opcoes so existem em escolha unica (`TEMPLATE_ITEM_OPTIONS_NOT_ALLOWED`). */
export function supportsOptions(type: ResponseType): boolean {
  return type === 'SINGLE_CHOICE'
}

/** Como a falha aparece para o tecnico, para rotular as regras de falha. */
export function failureLabel(type: ResponseType): string | null {
  if (type === 'CONFORMITY') return 'se NC'
  if (type === 'BOOLEAN') return 'se Não'
  return null
}

/**
 * Trocar o tipo apaga a configuracao que o novo tipo nao aceita: as opcoes da
 * escolha unica e as regras de falha. Retorna o que seria perdido, para a tela
 * avisar antes (issue #14).
 */
export function settingsLostOnTypeChange(
  item: Pick<ItemInput, 'responseType' | 'options' | 'observationRequiredOnFailure' | 'evidenceRequiredOnFailure'>,
  next: ResponseType,
): readonly string[] {
  const lost: string[] = []
  if (supportsOptions(item.responseType) && !supportsOptions(next) && item.options.some((option) => option.trim() !== '')) {
    lost.push('as opções da escolha única')
  }
  if (
    supportsFailureRules(item.responseType) &&
    !supportsFailureRules(next) &&
    (item.observationRequiredOnFailure || item.evidenceRequiredOnFailure)
  ) {
    lost.push('as exigências de observação e evidência na falha')
  }
  return lost
}

/** Ajusta o item ao tipo: o que o tipo nao aceita sai antes do envio. */
export function normalizeItemForType(item: ItemInput): ItemInput {
  return {
    ...item,
    options: supportsOptions(item.responseType) ? item.options.map((option) => option.trim()) : [],
    observationRequiredOnFailure: supportsFailureRules(item.responseType) && item.observationRequiredOnFailure,
    evidenceRequiredOnFailure: supportsFailureRules(item.responseType) && item.evidenceRequiredOnFailure,
  }
}

/** Numero de apresentacao do item, como `1.2` (secao 1, item 2). */
export function itemNumber(sectionOrder: number, itemOrder: number): string {
  return `${sectionOrder}.${itemOrder}`
}

/** Versao do rascunho em edicao: a proxima depois da vigente. */
export function draftVersionNumber(template: Pick<InspectionTemplate, 'currentVersion'>): number {
  return (template.currentVersion ?? 0) + 1
}

/** Troca o elemento com o vizinho de cima (-1) ou de baixo (1); nos limites, devolve a mesma lista. */
export function moved<T>(list: readonly T[], index: number, delta: -1 | 1): readonly T[] {
  const target = index + delta
  if (index < 0 || index >= list.length || target < 0 || target >= list.length) return list
  const next = [...list]
  ;[next[index], next[target]] = [next[target] as T, next[index] as T]
  return next
}
