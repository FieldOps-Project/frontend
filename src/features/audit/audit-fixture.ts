import 'server-only'

import { demoEvidences } from '@/features/evidence/evidence-fixture'
import { demoInspectionDetail, demoInspectionHistory } from '@/features/inspections/detail-fixture'
import { demoInspections } from '@/features/inspections/list-fixture'
import { demoNonConformities } from '@/features/non-conformities/non-conformity-fixture'
import { demoTemplateId } from '@/features/templates/template-demo-store'
import type { AuditEvent } from '@/lib/domain/audit'
import type { InspectionHistoryEvent } from '@/lib/domain/inspection-detail'

/**
 * Eventos de auditoria de demonstracao, servidos so em
 * `NEXT_PUBLIC_APP_ENV=development` enquanto a API nao publica a consulta
 * (backend #29).
 *
 * Saem das mesmas inspecoes, fotos e nao conformidades das outras telas -- o
 * cancelamento feito no detalhe aparece aqui tambem -- mais alguns eventos
 * fora das inspecoes, como os do prototipo do Stitch (publicacao de modelo,
 * edicao de registro e relatorio gerado pelo sistema).
 */
type Draft = Omit<AuditEvent, 'id' | 'code'>

/** Identificador estavel por nome, para o filtro de usuario. */
function actorId(name: string | null): string | null {
  if (!name) return null
  return `user-${name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')}`
}

/**
 * Horario do servidor de algo registrado no aplicativo: nunca antes do
 * dispositivo. A inspecao em execucao sincroniza item a item, entao o servidor
 * recebe alguns minutos depois da captura.
 */
function receivedAfter(server: string | null, device: string): string {
  const earliest = new Date(Date.parse(device) + 2 * 60_000).toISOString()
  return server && server > earliest ? server : earliest
}

function minutesAgo(now: Date, minutes: number): string {
  return new Date(now.getTime() - minutes * 60_000).toISOString()
}

function inspectionEvents(now: Date): Draft[] {
  return demoInspections(now).flatMap((item) =>
    (demoInspectionHistory(item.id, now) ?? []).map((event) => ({
      action: event.action,
      actorId: actorId(event.actorName),
      actorName: event.actorName,
      entityType: 'INSPECTION' as const,
      entityId: item.id,
      entityLabel: item.code,
      inspectionId: item.id,
      occurredAt: event.occurredAt,
      deviceOccurredAt: event.deviceOccurredAt,
      description: [`${item.title} · ${item.clientName}`, event.note].filter(Boolean).join(' — '),
    })),
  )
}

function evidenceEvents(now: Date): Draft[] {
  return demoEvidences(now).flatMap((evidence) => {
    const inspection = demoInspectionDetail(evidence.inspectionId, now)
    if (!inspection || !evidence.serverReceivedAt) return []
    return [
      {
        action: 'EVIDENCE_ADDED',
        actorId: actorId(inspection.technicianName),
        actorName: inspection.technicianName,
        entityType: 'EVIDENCE' as const,
        entityId: evidence.id,
        entityLabel: evidence.itemCode ? `${inspection.code} · item ${evidence.itemCode}` : inspection.code,
        inspectionId: inspection.id,
        occurredAt: receivedAfter(evidence.serverReceivedAt, evidence.capturedAtDevice),
        deviceOccurredAt: evidence.capturedAtDevice,
        description: evidence.description ?? 'Fotografia sem descrição',
      },
    ]
  })
}

function nonConformityEvents(now: Date): Draft[] {
  return demoNonConformities(now).map((nc) => ({
    action: 'NON_CONFORMITY_CREATED',
    actorId: actorId(nc.createdByName),
    actorName: nc.createdByName,
    entityType: 'NON_CONFORMITY' as const,
    entityId: nc.id,
    entityLabel: nc.itemCode ? `${nc.inspectionCode} · item ${nc.itemCode}` : nc.inspectionCode,
    inspectionId: nc.inspectionId,
    occurredAt: receivedAfter(nc.serverReceivedAt, nc.createdAtDevice),
    deviceOccurredAt: nc.createdAtDevice,
    description: nc.title,
  }))
}

function systemEvents(now: Date): Draft[] {
  const admin = 'Mariana Costa'
  return [
    {
      action: 'TEMPLATE_PUBLISHED',
      actorId: actorId(admin),
      actorName: admin,
      entityType: 'TEMPLATE',
      entityId: demoTemplateId(1),
      entityLabel: 'Inspeção preventiva HVAC · v3',
      inspectionId: null,
      occurredAt: minutesAgo(now, 3 * 24 * 60 + 95),
      deviceOccurredAt: null,
      description: 'Versão 3 publicada e disponível para novos agendamentos.',
    },
    {
      action: 'RECORD_UPDATED',
      actorId: actorId('Roberto Lima'),
      actorName: 'Roberto Lima',
      entityType: 'TEMPLATE',
      entityId: demoTemplateId(4),
      entityLabel: 'Inspeção de Máquinas Pesadas',
      inspectionId: null,
      occurredAt: minutesAgo(now, 26 * 60 + 10),
      deviceOccurredAt: null,
      description: 'Descrição e categoria do modelo atualizadas no rascunho.',
    },
    {
      action: 'REPORT_GENERATED',
      actorId: null,
      actorName: null,
      entityType: 'REPORT',
      entityId: 'report-monthly',
      entityLabel: 'REL-MENSAL',
      inspectionId: null,
      occurredAt: minutesAgo(now, 6 * 60 + 15),
      deviceOccurredAt: null,
      description: 'Relatório mensal de conformidade gerado automaticamente.',
    },
  ]
}

/** Todos os eventos, do mais recente para o mais antigo, com o codigo `EVT-` em ordem de acontecimento. */
export function demoAuditEvents(now: Date = new Date()): readonly AuditEvent[] {
  const drafts = [...inspectionEvents(now), ...evidenceEvents(now), ...nonConformityEvents(now), ...systemEvents(now)]
    .filter((event) => Date.parse(event.occurredAt) <= now.getTime())
    .toSorted((a, b) => a.occurredAt.localeCompare(b.occurredAt))

  return drafts
    .map((event, index) => ({
      ...event,
      id: `audit-${String(index + 1).padStart(5, '0')}`,
      code: `EVT-${9000 + index + 1}`,
    }))
    .toReversed()
}

/**
 * Linha do tempo da inspecao (issue #24): mudancas de estado, fotografias e nao
 * conformidades, em ordem cronologica, como no exemplo do documento 10.12.1.
 */
export function demoInspectionTimeline(inspectionId: string, now: Date = new Date()): readonly InspectionHistoryEvent[] | null {
  const history = demoInspectionHistory(inspectionId, now)
  if (!history) return null

  const extra: InspectionHistoryEvent[] = [...evidenceEvents(now), ...nonConformityEvents(now)]
    .filter((event) => event.inspectionId === inspectionId)
    .map((event, index) => ({
      id: `${inspectionId}-timeline-${index + 1}`,
      action: event.action,
      actorName: event.actorName,
      occurredAt: event.occurredAt,
      deviceOccurredAt: event.deviceOccurredAt,
      previousStatus: null,
      newStatus: null,
      note: event.description,
    }))

  /** Pelo horario de campo quando existe: e a ordem em que as coisas aconteceram. */
  const when = (event: InspectionHistoryEvent) => event.deviceOccurredAt ?? event.occurredAt
  return [...history, ...extra].toSorted((a, b) => when(a).localeCompare(when(b)))
}
