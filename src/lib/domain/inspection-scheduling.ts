export const INSPECTION_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
export type InspectionPriority = (typeof INSPECTION_PRIORITIES)[number]

export const INSPECTION_PRIORITY_LABELS: Record<InspectionPriority, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
}

export const DEFAULT_INSPECTION_PRIORITY: InspectionPriority = 'MEDIUM'

export type PublishedTemplateVersion = {
  readonly versionId: string
  readonly templateTitle: string
  readonly category: string
  readonly versionNumber: number
}

export type ScheduleInspectionRequest = {
  readonly templateVersionId: string
  readonly clientId: string
  readonly siteId: string
  readonly equipmentId: string | null
  readonly technicianId: string
  readonly supervisorId: string | null
  readonly title: string
  readonly instructions: string | null
  readonly priority: InspectionPriority
  readonly scheduledFor: string
}

const SITE_INSPECTION_CATEGORIES: readonly string[] = ['local', 'ambiente', 'site', 'location', 'environment']

export function isInspectionPriority(value: unknown): value is InspectionPriority {
  return typeof value === 'string' && (INSPECTION_PRIORITIES as readonly string[]).includes(value)
}

export function requiresEquipment(templateCategory: string): boolean {
  return !SITE_INSPECTION_CATEGORIES.includes(templateCategory.trim().toLowerCase())
}

export function templateVersionLabel(version: PublishedTemplateVersion): string {
  return `${version.templateTitle} · v${version.versionNumber} (${version.category})`
}

export function scheduledForFromDate(date: string): string {
  return `${date}T00:00:00-03:00`
}
