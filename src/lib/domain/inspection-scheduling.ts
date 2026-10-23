/**
 * Contrato do agendamento de inspecao (documento 10.8, documento 12.10 e
 * issue #16).
 *
 * A API ainda nao publica `POST /inspections` nem a listagem de versoes
 * publicadas; estes tipos sao o formato que a tela envia e espera receber, e o
 * ponto de encontro com o backend quando os endpoints chegarem.
 */

/** Prioridade da inspecao (documento 10.8). */
export const INSPECTION_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
export type InspectionPriority = (typeof INSPECTION_PRIORITIES)[number]

export const INSPECTION_PRIORITY_LABELS: Record<InspectionPriority, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
}

/** Prioridade sugerida ao abrir o formulario. */
export const DEFAULT_INSPECTION_PRIORITY: InspectionPriority = 'MEDIUM'

/**
 * Versao publicada e ativa para novas inspecoes (RN-024), como aparece no
 * seletor de modelo.
 *
 * `requiresEquipment` diz se o modelo inspeciona um equipamento ou o local como
 * um todo (RN-026). O modelo de dados ainda nao tem esse campo; ele faz parte do
 * contrato que a tela pede ao backend.
 */
export type PublishedTemplateVersion = {
  readonly versionId: string
  readonly templateTitle: string
  readonly category: string
  readonly versionNumber: number
  readonly requiresEquipment: boolean
}

/** Corpo de `POST /inspections`: criacao com atribuicao imediata do tecnico. */
export type ScheduleInspectionRequest = {
  readonly templateVersionId: string
  readonly clientId: string
  readonly siteId: string
  readonly equipmentId: string | null
  readonly technicianId: string
  readonly supervisorId: string | null
  /** Inicio do dia previsto no fuso da operacao, em ISO-8601. */
  readonly scheduledFor: string
  readonly priority: InspectionPriority
  readonly instructions: string | null
}

export function isInspectionPriority(value: unknown): value is InspectionPriority {
  return typeof value === 'string' && (INSPECTION_PRIORITIES as readonly string[]).includes(value)
}

/** Rotulo do modelo no seletor, como `Inspeção preventiva HVAC · v3 (Climatização)`. */
export function templateVersionLabel(version: PublishedTemplateVersion): string {
  return `${version.templateTitle} · v${version.versionNumber} (${version.category})`
}

/**
 * Data prevista (`AAAA-MM-DD`) como inicio do dia em Sao Paulo. O seletor da
 * tela e de data; o modelo guarda data e hora (`scheduled_for`).
 */
export function scheduledForFromDate(date: string): string {
  return `${date}T00:00:00-03:00`
}
