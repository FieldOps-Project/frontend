import 'server-only'

import { demoInspectionChanges } from '@/features/inspections/inspection-demo-store'
import { DEMO_TECHNICIANS, demoInspections, seedInspections } from '@/features/inspections/list-fixture'
import { DEMO_REVIEW_ID } from '@/features/inspections/review-fixture'
import type { InspectionStatus } from '@/lib/domain/inspection'
import type { InspectionDetail } from '@/lib/domain/inspection-detail'
import type { InspectionHistoryEvent } from '@/lib/domain/inspection-history'
import type { InspectionListItem } from '@/lib/domain/inspection-list'

/**
 * Detalhe e historico das inspecoes de demonstracao.
 *
 * Parte das mesmas inspecoes do acompanhamento (`list-fixture`) e completa o
 * que a listagem nao tem: modelo, supervisor, instrucoes, horarios de execucao,
 * localizacao e o historico de estados. Os horarios seguem o estado de cada
 * inspecao -- so tem inicio quem ja foi iniciada, so tem envio quem ja foi
 * enviada -- e a inspecao em revisao mostra o caso offline do documento 14.9:
 * executada pela manha e recebida pelo servidor horas depois.
 */
export const DEMO_SUPERVISORS = {
  marianaCosta: { supervisorId: 'a0000000-0000-4000-8000-000000000011', supervisorName: 'Mariana Costa' },
  robertoLima: { supervisorId: 'a0000000-0000-4000-8000-000000000012', supervisorName: 'Roberto Lima' },
} as const

/** Pessoas que a edicao do planejamento oferece na demonstracao. */
export function demoPlanningPeople() {
  return {
    technicians: Object.values(DEMO_TECHNICIANS).flatMap(({ technicianId, technicianName }) =>
      technicianId && technicianName ? [{ id: technicianId, name: technicianName }] : [],
    ),
    supervisors: Object.values(DEMO_SUPERVISORS).map(({ supervisorId, supervisorName }) => ({
      id: supervisorId,
      name: supervisorName,
    })),
  }
}

const INSTRUCTIONS: Readonly<Record<string, string>> = {
  'INS-2023-089': 'Retirar a chave da casa de máquinas na portaria. Levar EPI para ruído.',
  'INSP-2023-0892': 'Acesso ao telhado somente com acompanhamento da manutenção predial.',
  'INS-2023-093': 'Conferir rotas de fuga e iluminação de emergência da doca.',
}

const CANCEL_REASON = 'Cliente pediu reagendamento: área interditada para obra.'
const REJECT_REASON = 'Fotos ilegíveis nos itens de pressão; refazer a medição.'

const STARTED: readonly InspectionStatus[] = ['IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']
const SENT: readonly InspectionStatus[] = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']
const REVIEWED: readonly InspectionStatus[] = ['UNDER_REVIEW', 'APPROVED', 'REJECTED']

function minutesAfter(value: string, minutes: number): string {
  return new Date(new Date(value).getTime() + minutes * 60_000).toISOString()
}

/** Identificador derivado do da inspecao, para local e equipamento terem UUID fixo. */
function derivedId(prefix: string, inspectionId: string): string {
  return `${prefix}0000000-0000-4000-8000-${inspectionId.slice(-12)}`
}

function templateOf(item: InspectionListItem) {
  return { templateVersionId: derivedId('5', item.id), templateTitle: item.title, templateVersionNumber: 1 }
}

export type DemoRecordedLocation = {
  readonly latitude: number
  readonly longitude: number
  readonly accuracy: number | null
  readonly capturedAtDevice: string
}

export type DemoInspectionDetail = InspectionDetail & {
  readonly code: string
  readonly answeredItems: number
  readonly startLocation: DemoRecordedLocation | null
}

type Execution = Pick<
  DemoInspectionDetail,
  'startedAtDevice' | 'startedAtServer' | 'completedAtDevice' | 'submittedAtServer' | 'startLocation'
>

function executionOf(seed: InspectionListItem, index: number, now: Date): Execution {
  if (!STARTED.includes(seed.status)) {
    return { startedAtDevice: null, startedAtServer: null, completedAtDevice: null, submittedAtServer: null, startLocation: null }
  }

  /** Inspecao prevista para mais tarde hoje, mas ja iniciada: o inicio nunca fica no futuro. */
  const planned = minutesAfter(seed.scheduledFor, 10)
  const latest = new Date(now.getTime() - 60 * 60_000).toISOString()
  const startedAtDevice = planned < latest ? planned : latest
  const completedAtDevice = SENT.includes(seed.status) ? minutesAfter(startedAtDevice, 165) : null
  /** A inspecao em revisao foi feita sem internet: o servidor so recebeu seis horas depois. */
  const offline = seed.id === DEMO_REVIEW_ID

  return {
    startedAtDevice,
    startedAtServer: minutesAfter(startedAtDevice, offline ? 525 : 2),
    completedAtDevice,
    submittedAtServer: completedAtDevice ? minutesAfter(completedAtDevice, offline ? 360 : 20) : null,
    startLocation: {
      latitude: -23.55052 + index * 0.0137,
      longitude: -46.633308 - index * 0.0091,
      accuracy: 6 + (index % 4) * 3,
      capturedAtDevice: startedAtDevice,
    },
  }
}

function event(
  inspectionId: string,
  n: number,
  fields: Omit<InspectionHistoryEvent, 'id' | 'entityType' | 'actorId' | 'deviceOccurredAt' | 'note'> &
    Partial<Pick<InspectionHistoryEvent, 'deviceOccurredAt' | 'note'>>,
): InspectionHistoryEvent {
  return { id: `${inspectionId}-event-${n}`, entityType: 'INSPECTION', actorId: null, deviceOccurredAt: null, note: null, ...fields }
}

type Base = Pick<DemoInspectionDetail, 'supervisorName' | 'technicianName' | 'createdAt' | 'canceledAt'> & Execution

/** Historico de estados como a auditoria registraria ate o estado semeado (documento 10.12.1). */
function seedHistory(seed: InspectionListItem, base: Base): InspectionHistoryEvent[] {
  const id = seed.id
  const supervisor = base.supervisorName
  const events: InspectionHistoryEvent[] = [
    event(id, 1, { action: 'INSPECTION_CREATED', actorName: supervisor, occurredAt: base.createdAt, previousStatus: null, newStatus: 'DRAFT' }),
  ]
  if (seed.status === 'DRAFT') return events

  events.push(
    event(id, 2, {
      action: 'INSPECTION_ASSIGNED',
      actorName: supervisor,
      occurredAt: minutesAfter(base.createdAt, 5),
      previousStatus: 'DRAFT',
      newStatus: 'ASSIGNED',
      note: base.technicianName ? `Técnico: ${base.technicianName}` : null,
    }),
  )

  if (seed.status === 'CANCELED') {
    events.push(
      event(id, 3, {
        action: 'INSPECTION_CANCELED',
        actorName: supervisor,
        occurredAt: base.canceledAt ?? minutesAfter(base.createdAt, 60),
        previousStatus: 'ASSIGNED',
        newStatus: 'CANCELED',
        note: CANCEL_REASON,
      }),
    )
    return events
  }

  if (base.startedAtDevice && base.startedAtServer) {
    events.push(
      event(id, 3, {
        action: 'INSPECTION_STARTED',
        actorName: base.technicianName,
        occurredAt: base.startedAtServer,
        deviceOccurredAt: base.startedAtDevice,
        previousStatus: 'ASSIGNED',
        newStatus: 'IN_PROGRESS',
      }),
    )
  }
  if (base.completedAtDevice && base.submittedAtServer) {
    events.push(
      event(id, 4, {
        action: 'INSPECTION_SUBMITTED',
        actorName: base.technicianName,
        occurredAt: base.submittedAtServer,
        deviceOccurredAt: base.completedAtDevice,
        previousStatus: 'IN_PROGRESS',
        newStatus: 'SUBMITTED',
      }),
    )
  }
  if (base.submittedAtServer && REVIEWED.includes(seed.status)) {
    const reviewStart = minutesAfter(base.submittedAtServer, 25)
    events.push(
      event(id, 5, {
        action: 'REVIEW_STARTED',
        actorName: supervisor,
        occurredAt: reviewStart,
        previousStatus: 'SUBMITTED',
        newStatus: 'UNDER_REVIEW',
      }),
    )
    if (seed.status === 'APPROVED' || seed.status === 'REJECTED') {
      const approved = seed.status === 'APPROVED'
      events.push(
        event(id, 6, {
          action: approved ? 'INSPECTION_APPROVED' : 'INSPECTION_REJECTED',
          actorName: supervisor,
          occurredAt: minutesAfter(reviewStart, 15),
          previousStatus: 'UNDER_REVIEW',
          newStatus: seed.status,
          note: approved ? null : REJECT_REASON,
        }),
      )
    }
  }
  return events
}

type DemoInspection = { readonly detail: DemoInspectionDetail; readonly history: readonly InspectionHistoryEvent[] }

function build(id: string, now: Date): DemoInspection | null {
  const seeds = seedInspections(now)
  const index = seeds.findIndex((candidate) => candidate.id === id)
  const seed = seeds[index]
  const current = demoInspections(now).find((candidate) => candidate.id === id)
  if (!seed || !current) return null

  const supervisor = index % 2 === 0 ? DEMO_SUPERVISORS.marianaCosta : DEMO_SUPERVISORS.robertoLima
  const createdAt = minutesAfter(seed.scheduledFor, -5 * 24 * 60)
  const canceledAt = seed.status === 'CANCELED' ? minutesAfter(seed.scheduledFor, -26 * 60) : null
  const execution = executionOf(seed, index, now)
  const base: Base = { ...execution, supervisorName: supervisor.supervisorName, technicianName: seed.technicianName, createdAt, canceledAt }
  const changes = demoInspectionChanges(id)
  const patch = changes?.patch ?? {}

  const detail: DemoInspectionDetail = {
    id,
    code: current.code,
    title: current.title,
    status: current.status,
    priority: current.priority,
    ...templateOf(current),
    clientId: current.clientId,
    clientName: current.clientName,
    siteId: derivedId('d', id),
    siteName: current.siteName,
    equipmentId: current.equipmentName ? derivedId('f', id) : null,
    equipmentName: current.equipmentName,
    technicianId: current.technicianId,
    technicianName: current.technicianName,
    supervisorId: patch.supervisorId !== undefined ? patch.supervisorId : supervisor.supervisorId,
    supervisorName: patch.supervisorName !== undefined ? patch.supervisorName : supervisor.supervisorName,
    scheduledFor: current.scheduledFor,
    instructions: patch.instructions !== undefined ? patch.instructions : (INSTRUCTIONS[current.code] ?? null),
    ...execution,
    answeredItems: current.answeredItems,
    applicableItems: current.applicableItems,
    canceledByName: patch.canceledByName ?? (canceledAt ? supervisor.supervisorName : null),
    canceledAt: patch.canceledAt ?? canceledAt,
    canceledReason: patch.canceledReason ?? (canceledAt ? CANCEL_REASON : null),
    createdAt,
    updatedAt: current.updatedAt,
  }

  return { detail, history: [...seedHistory(seed, base), ...(changes?.events ?? [])] }
}

export function isDemoInspectionId(id: string, now: Date = new Date()): boolean {
  return seedInspections(now).some((candidate) => candidate.id === id)
}

export function demoInspectionDetail(id: string, now: Date = new Date()): DemoInspectionDetail | null {
  return build(id, now)?.detail ?? null
}

export function demoInspectionHistory(id: string, now: Date = new Date()): readonly InspectionHistoryEvent[] | null {
  return build(id, now)?.history ?? null
}
