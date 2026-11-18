import 'server-only'

import { demoInspectionChanges } from '@/features/inspections/inspection-demo-store'
import { DEMO_REVIEW_ID } from '@/features/inspections/review-fixture'
import { dayInSaoPaulo, type InspectionListItem } from '@/lib/domain/inspection-list'

/**
 * Inspecoes de demonstracao do acompanhamento.
 *
 * A API ainda devolve uma inspecao fixa em `GET /inspections`. Ate a listagem
 * paginada existir (backend #18), estas inspecoes -- as do prototipo da tela e
 * a da tela de revisao -- mostram filtros, atraso, progresso e paginacao
 * funcionando. As datas sao relativas a hoje, para que "atrasada" e "hoje"
 * continuem verdadeiras em qualquer dia. O que a pessoa cancela ou replaneja no
 * detalhe (`inspection-demo-store`) aparece aqui por cima das sementes.
 */
type Seed = Omit<InspectionListItem, 'scheduledFor' | 'updatedAt'> & {
  /** Dias a partir de hoje (negativo e passado) e horario local. */
  readonly day: number
  readonly time: string
}

export const DEMO_TECHNICIANS = {
  carlosSilva: { technicianId: 'a0000000-0000-4000-8000-000000000001', technicianName: 'Carlos Silva' },
  anaPaula: { technicianId: 'a0000000-0000-4000-8000-000000000002', technicianName: 'Ana Paula' },
  carlosMendes: { technicianId: 'a0000000-0000-4000-8000-000000000003', technicianName: 'Carlos Mendes' },
  joaoPedro: { technicianId: 'a0000000-0000-4000-8000-000000000004', technicianName: 'João Pedro' },
  unassigned: { technicianId: null, technicianName: null },
} as const

const CLIENTS = {
  alpha: { clientId: 'b0000000-0000-4000-8000-000000000001', clientName: 'Indústria Alpha' },
  beta: { clientId: 'b0000000-0000-4000-8000-000000000002', clientName: 'Logística Beta' },
  omega: { clientId: 'b0000000-0000-4000-8000-000000000003', clientName: 'Construtora Omega' },
  delta: { clientId: 'b0000000-0000-4000-8000-000000000004', clientName: 'Hospital Delta' },
} as const

function id(n: number): string {
  return `c0000000-0000-4000-8000-${String(n).padStart(12, '0')}`
}

const SEEDS: readonly Seed[] = [
  { id: id(89), code: 'INS-2023-089', title: 'Manutenção Preventiva', ...CLIENTS.alpha, siteName: 'Galpão 3 - Setor Sul', equipmentName: 'Compressor GA-75', ...DEMO_TECHNICIANS.carlosSilva, priority: 'HIGH', status: 'ASSIGNED', day: -2, time: '09:00', answeredItems: 0, applicableItems: 36 },
  { id: id(90), code: 'INS-2023-090', title: 'Inspeção de Rotina', ...CLIENTS.beta, siteName: 'Armazém Central', equipmentName: 'Empilhadeira E-400', ...DEMO_TECHNICIANS.anaPaula, priority: 'MEDIUM', status: 'IN_PROGRESS', day: 0, time: '14:00', answeredItems: 12, applicableItems: 28 },
  { id: id(91), code: 'INS-2023-091', title: 'Certificação Anual', ...CLIENTS.omega, siteName: 'Obra - Torre C', equipmentName: 'Guindaste G-120', ...DEMO_TECHNICIANS.unassigned, priority: 'LOW', status: 'DRAFT', day: 3, time: '08:00', answeredItems: 0, applicableItems: 54 },
  { id: DEMO_REVIEW_ID, code: 'INSP-2023-0892', title: 'Inspeção preventiva HVAC', ...CLIENTS.alpha, siteName: 'Roof Level', equipmentName: 'HVAC Unit B', ...DEMO_TECHNICIANS.carlosMendes, priority: 'CRITICAL', status: 'UNDER_REVIEW', day: -1, time: '08:15', answeredItems: 42, applicableItems: 42 },
  { id: id(92), code: 'INS-2023-092', title: 'Vistoria de extintores', ...CLIENTS.delta, siteName: 'Bloco A - Térreo', equipmentName: 'Extintor PQS 12 kg', ...DEMO_TECHNICIANS.joaoPedro, priority: 'HIGH', status: 'IN_PROGRESS', day: -1, time: '10:30', answeredItems: 8, applicableItems: 15 },
  { id: id(93), code: 'INS-2023-093', title: 'Inspeção geral do local', ...CLIENTS.beta, siteName: 'Doca 2', equipmentName: null, ...DEMO_TECHNICIANS.anaPaula, priority: 'MEDIUM', status: 'ASSIGNED', day: 1, time: '07:30', answeredItems: 0, applicableItems: 20 },
  { id: id(94), code: 'INS-2023-094', title: 'Manutenção Preventiva', ...CLIENTS.alpha, siteName: 'Galpão 1', equipmentName: 'Caldeira CB-2', ...DEMO_TECHNICIANS.carlosSilva, priority: 'CRITICAL', status: 'REJECTED', day: -4, time: '13:00', answeredItems: 30, applicableItems: 31 },
  { id: id(95), code: 'INS-2023-095', title: 'Inspeção de Rotina', ...CLIENTS.omega, siteName: 'Obra - Torre A', equipmentName: 'Betoneira BT-400', ...DEMO_TECHNICIANS.joaoPedro, priority: 'LOW', status: 'APPROVED', day: -6, time: '09:00', answeredItems: 18, applicableItems: 18 },
  { id: id(96), code: 'INS-2023-096', title: 'Certificação Anual', ...CLIENTS.delta, siteName: 'Subsolo - Casa de máquinas', equipmentName: 'Gerador GD-500', ...DEMO_TECHNICIANS.carlosMendes, priority: 'HIGH', status: 'ASSIGNED', day: 5, time: '08:00', answeredItems: 0, applicableItems: 48 },
  { id: id(97), code: 'INS-2023-097', title: 'Vistoria de extintores', ...CLIENTS.alpha, siteName: 'Galpão 3 - Setor Norte', equipmentName: 'Extintor CO2 6 kg', ...DEMO_TECHNICIANS.anaPaula, priority: 'MEDIUM', status: 'CANCELED', day: -3, time: '15:00', answeredItems: 0, applicableItems: 15 },
  { id: id(98), code: 'INS-2023-098', title: 'Manutenção Preventiva', ...CLIENTS.beta, siteName: 'Armazém Central', equipmentName: 'Esteira EST-10', ...DEMO_TECHNICIANS.carlosSilva, priority: 'MEDIUM', status: 'ASSIGNED', day: 2, time: '11:00', answeredItems: 0, applicableItems: 24 },
  { id: id(99), code: 'INS-2023-099', title: 'Inspeção de Rotina', ...CLIENTS.delta, siteName: 'Bloco B - 2º andar', equipmentName: 'Chiller CH-3', ...DEMO_TECHNICIANS.unassigned, priority: 'LOW', status: 'DRAFT', day: 7, time: '09:30', answeredItems: 0, applicableItems: 30 },
  { id: id(100), code: 'INS-2023-100', title: 'Vistoria de extintores', ...CLIENTS.omega, siteName: 'Obra - Torre B', equipmentName: 'Extintor AP 10 L', ...DEMO_TECHNICIANS.joaoPedro, priority: 'MEDIUM', status: 'SUBMITTED', day: -3, time: '08:30', answeredItems: 15, applicableItems: 15 },
  { id: id(101), code: 'INS-2023-101', title: 'Manutenção Preventiva', ...CLIENTS.delta, siteName: 'Subsolo - Casa de máquinas', equipmentName: 'Bomba de recalque BR-2', ...DEMO_TECHNICIANS.carlosSilva, priority: 'HIGH', status: 'SUBMITTED', day: -1, time: '15:00', answeredItems: 22, applicableItems: 22 },
]

/** Instante no dia relativo de hoje, no horario de Sao Paulo (UTC-3). */
function at(now: Date, day: number, time: string): string {
  const today = dayInSaoPaulo(now)
  const base = new Date(`${today}T${time}:00-03:00`)
  return new Date(base.getTime() + day * 86_400_000).toISOString()
}

/** Inspecoes como foram semeadas, sem as mudancas feitas na demonstracao. */
export function seedInspections(now: Date = new Date()): readonly InspectionListItem[] {
  return SEEDS.map(({ day, time, ...item }) => ({
    ...item,
    scheduledFor: at(now, day, time),
    updatedAt: at(now, Math.min(day, 0), '07:00'),
  }))
}

function withChanges(item: InspectionListItem): InspectionListItem {
  const patch = demoInspectionChanges(item.id)?.patch
  if (!patch) return item
  return {
    ...item,
    status: patch.status ?? item.status,
    priority: patch.priority ?? item.priority,
    technicianId: patch.technicianId !== undefined ? patch.technicianId : item.technicianId,
    technicianName: patch.technicianName !== undefined ? patch.technicianName : item.technicianName,
    scheduledFor: patch.scheduledFor ?? item.scheduledFor,
    updatedAt: patch.updatedAt ?? item.updatedAt,
  }
}

export function demoInspections(now: Date = new Date()): readonly InspectionListItem[] {
  return seedInspections(now).map(withChanges)
}
