import { describe, expect, it } from 'vitest'

import { INSPECTION_STATUSES, type InspectionStatus } from '@/lib/domain/inspection'
import {
  canCancel,
  canEditPlanning,
  canOpenReview,
  composeInspectionDetail,
  historyActionLabel,
  scheduledDateInSaoPaulo,
  type InspectionDetailParts,
  type InspectionRecord,
} from '@/lib/domain/inspection-detail'
import type { InspectionHistoryEntry } from '@/lib/domain/inspection-history'

function statusesWhere(rule: (status: InspectionStatus) => boolean): InspectionStatus[] {
  return INSPECTION_STATUSES.filter(rule)
}

describe('acoes conforme o estado', () => {
  it('cancela so nos estados do documento 7.6, nunca aprovada (RN-030)', () => {
    expect(statusesWhere(canCancel)).toEqual(['ASSIGNED', 'IN_PROGRESS', 'REJECTED'])
    expect(canCancel('APPROVED')).toBe(false)
  })

  it('oferece revisao so com a inspecao enviada ou em revisao', () => {
    expect(statusesWhere(canOpenReview)).toEqual(['SUBMITTED', 'UNDER_REVIEW'])
  })

  it('bloqueia a edicao do planejamento depois do inicio da execucao', () => {
    expect(statusesWhere(canEditPlanning)).toEqual(['DRAFT', 'ASSIGNED'])
  })
})

describe('historyActionLabel', () => {
  it('traduz as acoes conhecidas e mantem as desconhecidas como vieram', () => {
    expect(historyActionLabel('INSPECTION_CANCELED')).toBe('Inspeção cancelada')
    expect(historyActionLabel('EVIDENCE_ADDED')).toBe('Fotografia capturada')
    expect(historyActionLabel('INSPECTION_REPORT_EXPORTED')).toBe('Relatório exportado')
    expect(historyActionLabel('NON_CONFORMITY_UPDATED')).toBe('Não conformidade atualizada')
    expect(historyActionLabel('ALGO_NOVO')).toBe('ALGO_NOVO')
  })
})

describe('scheduledDateInSaoPaulo', () => {
  it('le a data prevista no fuso da operacao, sem pular para o dia seguinte', () => {
    expect(scheduledDateInSaoPaulo('2026-11-18T23:30:00-03:00')).toBe('2026-11-18')
  })
})

const RECORD: InspectionRecord = {
  id: 'i1',
  templateVersionId: 'tv1',
  clientId: 'c1',
  siteId: 's1',
  equipmentId: 'e1',
  technicianId: 't1',
  supervisorId: null,
  title: 'Inspeção preventiva',
  instructions: null,
  priority: 'MEDIUM',
  status: 'ASSIGNED',
  scheduledFor: '2026-11-20T12:00:00Z',
  createdAt: '2026-11-18T12:00:00Z',
  updatedAt: '2026-11-18T12:00:00Z',
  itemSnapshots: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
}

function entry(fields: Partial<InspectionHistoryEntry>): InspectionHistoryEntry {
  return {
    id: 'e',
    action: 'INSPECTION_CREATED',
    entityType: 'INSPECTION',
    entityId: 'i1',
    actorId: 'u1',
    actorName: 'Supervisor Demo',
    occurredAt: '2026-11-18T12:00:00Z',
    deviceOccurredAt: null,
    requestId: null,
    deviceId: null,
    previousValue: null,
    newValue: null,
    ...fields,
  }
}

function parts(overrides: Partial<InspectionDetailParts> = {}): InspectionDetailParts {
  return {
    inspection: RECORD,
    template: { title: 'Checklist de geradores', versionNumber: 2 },
    clientName: 'Indústria ABC',
    siteName: 'Fábrica Sorocaba',
    equipmentName: 'Gerador GD-001',
    technicianName: 'Técnico Demo',
    supervisorName: null,
    history: [],
    ...overrides,
  }
}

describe('composeInspectionDetail', () => {
  it('junta o registro da API com os nomes resolvidos e conta os itens do checklist', () => {
    expect(composeInspectionDetail(parts())).toMatchObject({
      id: 'i1',
      templateTitle: 'Checklist de geradores',
      templateVersionNumber: 2,
      clientName: 'Indústria ABC',
      siteName: 'Fábrica Sorocaba',
      equipmentName: 'Gerador GD-001',
      technicianId: 't1',
      technicianName: 'Técnico Demo',
      supervisorName: null,
      applicableItems: 3,
    })
  })

  it('mantem o nome nulo quando a pessoa nao pode ser resolvida', () => {
    expect(composeInspectionDetail(parts({ technicianName: null })).technicianName).toBeNull()
  })

  it('traz os horarios de execucao do historico', () => {
    const started = entry({
      action: 'INSPECTION_STARTED',
      newValue: 'status=IN_PROGRESS;startedAtDevice=2026-11-20T12:00:00Z;startedAtServer=2026-11-20T15:00:00Z',
    })
    expect(composeInspectionDetail(parts({ history: [started] }))).toMatchObject({
      startedAtDevice: '2026-11-20T12:00:00Z',
      startedAtServer: '2026-11-20T15:00:00Z',
      completedAtDevice: null,
      submittedAtServer: null,
    })
  })

  it('so expoe o cancelamento quando a inspecao esta cancelada (RN-029)', () => {
    const canceled = entry({
      action: 'INSPECTION_CANCELED',
      newValue: 'status=CANCELED;canceledAt=2026-11-19T10:00:00Z;canceledReason=Cliente pediu',
    })
    const active = composeInspectionDetail(parts({ history: [canceled] }))
    expect(active).toMatchObject({ canceledByName: null, canceledAt: null, canceledReason: null })

    const detail = composeInspectionDetail(parts({ inspection: { ...RECORD, status: 'CANCELED' }, history: [canceled] }))
    expect(detail).toMatchObject({
      canceledByName: 'Supervisor Demo',
      canceledAt: '2026-11-19T10:00:00Z',
      canceledReason: 'Cliente pediu',
    })
  })
})
