import 'server-only'

import type { InspectionDetail } from '@/lib/domain/inspection-detail'
import type { InspectionHistoryEvent } from '@/lib/domain/inspection-history'

/**
 * Memoria das inspecoes de demonstracao, servidas so em
 * `NEXT_PUBLIC_APP_ENV=development` enquanto a API nao publica o detalhe, o
 * historico e a edicao da inspecao.
 *
 * Guarda so o que a pessoa mudou -- cancelamento e planejamento -- por cima das
 * inspecoes de demonstracao, e o evento de historico de cada mudanca. Assim a
 * listagem, o painel e o detalhe mostram a mesma inspecao cancelada, como
 * aconteceria com a API. O estado vive em `globalThis`, para sobreviver ao
 * recarregamento de modulos do `next dev`, e volta ao inicial quando o servidor
 * reinicia.
 */
export type DemoInspectionPatch = Partial<
  Pick<
    InspectionDetail,
    | 'status'
    | 'priority'
    | 'technicianId'
    | 'technicianName'
    | 'supervisorId'
    | 'supervisorName'
    | 'scheduledFor'
    | 'instructions'
    | 'canceledByName'
    | 'canceledAt'
    | 'canceledReason'
    | 'updatedAt'
  >
>

export type DemoInspectionChanges = {
  readonly patch: DemoInspectionPatch
  readonly events: readonly InspectionHistoryEvent[]
}

const globalStore = globalThis as typeof globalThis & {
  __fieldopsDemoInspections?: Map<string, DemoInspectionChanges>
}

function store(): Map<string, DemoInspectionChanges> {
  globalStore.__fieldopsDemoInspections ??= new Map()
  return globalStore.__fieldopsDemoInspections
}

export function demoInspectionChanges(id: string): DemoInspectionChanges | undefined {
  return store().get(id)
}

/** Aplica a mudanca e registra o evento correspondente no historico. */
export function recordDemoInspectionChange(id: string, patch: DemoInspectionPatch, event: InspectionHistoryEvent): void {
  const current = store().get(id)
  store().set(id, {
    patch: { ...current?.patch, ...patch },
    events: [...(current?.events ?? []), event],
  })
}

/** Volta ao estado inicial. Usado pelos testes. */
export function resetDemoInspections(): void {
  globalStore.__fieldopsDemoInspections = new Map()
}
