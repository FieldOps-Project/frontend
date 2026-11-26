import { describe, expect, it } from 'vitest'

import {
  auditActionOptions,
  auditActorOptions,
  auditActionTone,
  auditEntityLabel,
  auditEntityOptions,
  auditEventDetail,
  filterAuditEvents,
  mergeAuditEvents,
  paginateEvents,
  periodStart,
  toAuditEvents,
  type AuditEvent,
} from '@/lib/domain/audit'
import { historyActionLabel } from '@/lib/domain/inspection-detail'

function event(overrides: Partial<AuditEvent>): AuditEvent {
  return {
    id: 'e1',
    action: 'INSPECTION_SUBMITTED',
    entityType: 'INSPECTION',
    actorId: 'u1',
    actorName: 'Carlos Silva',
    occurredAt: '2026-11-18T17:00:00Z',
    deviceOccurredAt: null,
    previousStatus: null,
    newStatus: null,
    note: null,
    inspectionId: 'i1',
    inspectionTitle: 'Inspeção preventiva',
    ...overrides,
  }
}

const SUBMITTED = event({ id: 'a', occurredAt: '2026-11-18T17:00:00Z' })
const APPROVED = event({
  id: 'b',
  action: 'INSPECTION_APPROVED',
  actorId: 'u2',
  actorName: 'Ana Souza',
  occurredAt: '2026-11-10T15:00:00Z',
})
const EXPORTED = event({
  id: 'c',
  action: 'INSPECTION_REPORT_EXPORTED',
  entityType: 'INSPECTION_REPORT',
  occurredAt: '2026-08-01T15:00:00Z',
})

describe('rotulos e tons', () => {
  it('traduz todas as entidades reais e mantem as desconhecidas', () => {
    expect(auditEntityLabel('INSPECTION_EVIDENCE')).toBe('Evidência')
    expect(auditEntityLabel('INSPECTION_REPORT')).toBe('Relatório')
    expect(auditEntityLabel('ALGO_NOVO')).toBe('ALGO_NOVO')
  })

  it('cobre as acoes que a API registra', () => {
    expect(historyActionLabel('INSPECTION_REPORT_EXPORTED')).toBe('Relatório exportado')
    expect(historyActionLabel('NON_CONFORMITY_UPDATED')).toBe('Não conformidade atualizada')
  })

  it('pinta o selo: aprovacao azul, reprovacao vermelha, o resto cinza', () => {
    expect(auditActionTone('INSPECTION_APPROVED')).toBe('info')
    expect(auditActionTone('INSPECTION_REJECTED')).toBe('danger')
    expect(auditActionTone('INSPECTION_REPORT_EXPORTED')).toBe('neutral')
  })
})

describe('periodStart', () => {
  it('calcula o inicio do periodo no fuso da operacao', () => {
    expect(periodStart('today', '2026-11-18')).toBe('2026-11-18')
    expect(periodStart('7d', '2026-11-18')).toBe('2026-11-12')
    expect(periodStart('all', '2026-11-18')).toBeNull()
  })
})

describe('linha do tempo', () => {
  it('ordena do mais recente para o mais antigo e carrega a inspecao', () => {
    const history = [
      { ...SUBMITTED, occurredAt: '2026-11-01T10:00:00Z', id: 'old' },
      { ...SUBMITTED, occurredAt: '2026-11-02T10:00:00Z', id: 'new' },
    ]
    const events = toAuditEvents({ id: 'i9', title: 'Título' }, history)

    expect(events.map((item) => item.id)).toEqual(['new', 'old'])
    expect(events[0]).toMatchObject({ inspectionId: 'i9', inspectionTitle: 'Título' })
  })

  it('mescla grupos mantendo a ordem global', () => {
    expect(mergeAuditEvents([[APPROVED], [SUBMITTED, EXPORTED]]).map((item) => item.id)).toEqual(['a', 'b', 'c'])
  })

  it('descreve a transicao de situacao e a observacao', () => {
    expect(auditEventDetail(event({ previousStatus: 'SUBMITTED', newStatus: 'APPROVED', note: 'Tudo certo' }))).toBe(
      'Enviada → Aprovada · Tudo certo',
    )
    expect(auditEventDetail(event({ note: 'Formato PDF' }))).toBe('Formato PDF')
    expect(auditEventDetail(event({}))).toBeNull()
  })
})

describe('filtros', () => {
  const events = [SUBMITTED, APPROVED, EXPORTED]

  it('filtra por periodo, usuario, registro e acao', () => {
    const today = '2026-11-18'
    expect(filterAuditEvents(events, { period: 'all' }, today)).toHaveLength(3)
    expect(filterAuditEvents(events, { period: '30d' }, today).map((item) => item.id)).toEqual(['a', 'b'])
    expect(filterAuditEvents(events, { period: 'all', actorId: 'u2' }, today).map((item) => item.id)).toEqual(['b'])
    expect(filterAuditEvents(events, { period: 'all', entityType: 'INSPECTION_REPORT' }, today).map((item) => item.id)).toEqual(['c'])
    expect(filterAuditEvents(events, { period: 'all', action: 'INSPECTION_APPROVED' }, today).map((item) => item.id)).toEqual(['b'])
  })

  it('deriva as opcoes dos proprios eventos, em ordem alfabetica', () => {
    expect(auditActorOptions([...events, event({ actorId: null, actorName: null })])).toEqual([
      { value: 'u2', label: 'Ana Souza' },
      { value: 'u1', label: 'Carlos Silva' },
    ])
    expect(auditEntityOptions(events)).toEqual([
      { value: 'INSPECTION', label: 'Inspeção' },
      { value: 'INSPECTION_REPORT', label: 'Relatório' },
    ])
    expect(auditActionOptions(events).map((option) => option.value)).toEqual([
      'INSPECTION_REPORT_EXPORTED',
      'INSPECTION_SUBMITTED',
      'INSPECTION_APPROVED',
    ])
  })
})

describe('paginateEvents', () => {
  const many = Array.from({ length: 25 }, (_, index) => event({ id: `e${index}` }))

  it('fatia a pagina pedida e informa o total', () => {
    const page = paginateEvents(many, 1, 10)
    expect(page).toMatchObject({ page: 1, totalElements: 25, totalPages: 3, first: false, last: false })
    expect(page.content).toHaveLength(10)
  })

  it('limita a pagina ao intervalo existente', () => {
    expect(paginateEvents(many, 99, 10)).toMatchObject({ page: 2, last: true })
    expect(paginateEvents([], 0, 10)).toMatchObject({ page: 0, totalPages: 1, first: true, last: true })
  })
})
