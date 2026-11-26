import { describe, expect, it } from 'vitest'

import {
  cancellationOf,
  executionTimesOf,
  toHistoryEvent,
  type InspectionHistoryEntry,
} from '@/lib/domain/inspection-history'

function entry(fields: Partial<InspectionHistoryEntry>): InspectionHistoryEntry {
  return {
    id: 'e1',
    action: 'INSPECTION_CREATED',
    entityType: 'INSPECTION',
    entityId: 'i1',
    actorId: 'u1',
    actorName: 'Supervisor Demo',
    occurredAt: '2026-11-20T12:00:00Z',
    deviceOccurredAt: null,
    requestId: null,
    deviceId: null,
    previousValue: null,
    newValue: null,
    ...fields,
  }
}

const STARTED = entry({
  id: 'started',
  action: 'INSPECTION_STARTED',
  actorName: 'Tecnico Demo',
  occurredAt: '2026-11-20T15:05:00Z',
  deviceOccurredAt: '2026-11-20T12:00:00Z',
  previousValue: 'status=ASSIGNED;technicianId=t1;startedAtDevice=null;startedAtServer=null;completedAtDevice=null;submittedAtServer=null',
  newValue:
    'status=IN_PROGRESS;technicianId=t1;startedAtDevice=2026-11-20T12:00:00Z;startedAtServer=2026-11-20T15:05:00Z;completedAtDevice=null;submittedAtServer=null',
})

const SUBMITTED = entry({
  id: 'submitted',
  action: 'INSPECTION_SUBMITTED',
  actorName: 'Tecnico Demo',
  occurredAt: '2026-11-20T21:30:00Z',
  deviceOccurredAt: '2026-11-20T14:40:00Z',
  previousValue: STARTED.newValue,
  newValue:
    'status=SUBMITTED;technicianId=t1;startedAtDevice=2026-11-20T12:00:00Z;startedAtServer=2026-11-20T15:05:00Z;completedAtDevice=2026-11-20T14:40:00Z;submittedAtServer=2026-11-20T21:30:00Z',
})

describe('toHistoryEvent', () => {
  it('deriva as mudancas de estado dos valores anterior e novo', () => {
    expect(toHistoryEvent(STARTED)).toMatchObject({
      action: 'INSPECTION_STARTED',
      actorName: 'Tecnico Demo',
      previousStatus: 'ASSIGNED',
      newStatus: 'IN_PROGRESS',
      deviceOccurredAt: '2026-11-20T12:00:00Z',
      note: null,
    })
  })

  it('deixa o estado nulo quando o evento nao informa status', () => {
    const assigned = entry({ action: 'INSPECTION_ASSIGNED', newValue: 'technicianId=t1' })
    expect(toHistoryEvent(assigned)).toMatchObject({ previousStatus: null, newStatus: null })
  })

  it('so le status em eventos da inspecao, nao de evidencia ou nao conformidade', () => {
    const evidence = entry({ entityType: 'INSPECTION_EVIDENCE', action: 'EVIDENCE_ADDED', newValue: 'status=APPROVED;id=x' })
    expect(toHistoryEvent(evidence)).toMatchObject({ previousStatus: null, newStatus: null })
  })

  it('ignora status que nao existe no modelo de dados', () => {
    expect(toHistoryEvent(entry({ newValue: 'status=OPEN' })).newStatus).toBeNull()
  })

  it('usa o motivo do cancelamento como nota', () => {
    const canceled = entry({
      action: 'INSPECTION_CANCELED',
      previousValue: 'status=ASSIGNED;technicianId=t1;canceledBy=null;canceledAt=null;canceledReason=null',
      newValue: 'status=CANCELED;technicianId=t1;canceledBy=u1;canceledAt=2026-11-21T10:00:00Z;canceledReason=Area interditada; sem acesso',
    })
    expect(toHistoryEvent(canceled)).toMatchObject({
      previousStatus: 'ASSIGNED',
      newStatus: 'CANCELED',
      note: 'Area interditada; sem acesso',
    })
  })

  it('usa o motivo da revisao e, sem ele, o comentario', () => {
    const rejected = entry({
      action: 'INSPECTION_REJECTED',
      newValue: 'status=REJECTED;reviewCycle=1;reviewerId=u2;reason=Fotos ilegiveis;comments=Refazer;itemsToCorrect=null',
    })
    const approved = entry({ action: 'INSPECTION_APPROVED', newValue: 'status=APPROVED;reviewCycle=1;reason=null;comments=Tudo certo' })
    expect(toHistoryEvent(rejected).note).toBe('Fotos ilegiveis')
    expect(toHistoryEvent(approved).note).toBe('Tudo certo')
  })

  it('descreve a exportacao do relatorio, que vem em JSON', () => {
    const exported = entry({ action: 'INSPECTION_REPORT_EXPORTED', entityType: 'INSPECTION_REPORT', actorName: null, newValue: '{"format":"PDF"}' })
    expect(toHistoryEvent(exported)).toMatchObject({ actorName: null, newStatus: null, note: 'Formato PDF' })
  })
})

describe('executionTimesOf', () => {
  it('le os horarios do dispositivo e do servidor do ultimo evento de execucao', () => {
    expect(executionTimesOf([entry({}), STARTED, SUBMITTED])).toEqual({
      startedAtDevice: '2026-11-20T12:00:00Z',
      startedAtServer: '2026-11-20T15:05:00Z',
      completedAtDevice: '2026-11-20T14:40:00Z',
      submittedAtServer: '2026-11-20T21:30:00Z',
    })
  })

  it('devolve so o inicio enquanto a inspecao esta em execucao', () => {
    expect(executionTimesOf([STARTED])).toEqual({
      startedAtDevice: '2026-11-20T12:00:00Z',
      startedAtServer: '2026-11-20T15:05:00Z',
      completedAtDevice: null,
      submittedAtServer: null,
    })
  })

  it('segue o estado da reabertura, que limpa a conclusao', () => {
    const reopened = entry({
      action: 'INSPECTION_REOPENED',
      newValue: 'status=IN_PROGRESS;technicianId=t1;startedAtDevice=2026-11-20T12:00:00Z;startedAtServer=2026-11-20T15:05:00Z;completedAtDevice=null;submittedAtServer=null',
    })
    expect(executionTimesOf([STARTED, SUBMITTED, reopened])).toMatchObject({ completedAtDevice: null, submittedAtServer: null })
  })

  it('devolve tudo nulo sem eventos de execucao', () => {
    expect(executionTimesOf([entry({})])).toEqual({
      startedAtDevice: null,
      startedAtServer: null,
      completedAtDevice: null,
      submittedAtServer: null,
    })
  })
})

describe('cancellationOf', () => {
  const canceled = entry({
    id: 'canceled',
    action: 'INSPECTION_CANCELED',
    actorName: 'Supervisor Demo',
    occurredAt: '2026-11-21T10:00:01Z',
    newValue: 'status=CANCELED;canceledBy=u1;canceledAt=2026-11-21T10:00:00Z;canceledReason=Cliente pediu reagendamento',
  })

  it('devolve quem cancelou, quando e por que (RN-029)', () => {
    expect(cancellationOf([entry({}), canceled])).toEqual({
      canceledByName: 'Supervisor Demo',
      canceledAt: '2026-11-21T10:00:00Z',
      canceledReason: 'Cliente pediu reagendamento',
    })
  })

  it('cai para o horario do evento quando o valor nao traz a data', () => {
    expect(cancellationOf([{ ...canceled, newValue: 'status=CANCELED;canceledReason=Motivo' }]).canceledAt).toBe('2026-11-21T10:00:01Z')
  })

  it('devolve tudo nulo sem evento de cancelamento', () => {
    expect(cancellationOf([entry({})])).toEqual({ canceledByName: null, canceledAt: null, canceledReason: null })
  })
})
