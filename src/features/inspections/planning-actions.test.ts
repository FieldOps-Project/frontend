import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { loadInspectionDetail, loadInspectionHistory } from '@/features/inspections/detail-data'
import { DEMO_SUPERVISORS } from '@/features/inspections/detail-fixture'
import { resetDemoInspections } from '@/features/inspections/inspection-demo-store'
import { DEMO_TECHNICIANS } from '@/features/inspections/list-fixture'
import { updateInspectionPlanning } from '@/features/inspections/planning-actions'
import { validatePlanning } from '@/features/inspections/planning-validation'
import { IDLE } from '@/lib/form-state'

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

class RedirectSignal extends Error {
  constructor(readonly target: string) {
    super(`redirect to ${target}`)
  }
}

vi.mock('next/navigation', () => ({
  redirect: (target: string) => {
    throw new RedirectSignal(target)
  },
  notFound: () => {
    throw new Error('not found')
  },
}))

const send = vi.fn()
const loadActiveUsers = vi.fn()

vi.mock('@/features/catalog/lookups', () => ({ loadActiveUsers: (role: string) => loadActiveUsers(role) }))

vi.mock('@/lib/dal', () => ({
  requireRole: async () => ({ id: 'u1', name: 'Mariana Costa', email: 'm@fieldops.dev', role: 'SUPERVISOR' }),
  send: (path: string, request: unknown) => send(path, request),
  formError: (error: Error) => ({ status: 'error', message: error.message, fieldErrors: {}, values: {} }),
  load: async () => ({ id: API_ID, status: 'ASSIGNED', scheduledFor: '2026-11-20T17:00:00Z' }),
  loadOptional: vi.fn(),
}))

const ASSIGNED_ID = 'c0000000-0000-4000-8000-000000000089'
const DRAFT_ID = 'c0000000-0000-4000-8000-000000000091'
const IN_PROGRESS_ID = 'c0000000-0000-4000-8000-000000000090'
const API_ID = '3d8dc050-54f4-4d3b-9e5d-5fdb29ae3ed5'
const ANA = DEMO_TECHNICIANS.anaPaula
const ROBERTO = DEMO_SUPERVISORS.robertoLima

function form(values: Record<string, string>) {
  const data = new FormData()
  for (const [name, value] of Object.entries(values)) data.set(name, value)
  return data
}

const VALID = {
  technicianId: ANA.technicianId,
  supervisorId: ROBERTO.supervisorId,
  scheduledDate: '2026-12-01',
  priority: 'CRITICAL',
  instructions: 'Levar escada.',
}

async function submit(id: string, values: Record<string, string>) {
  try {
    return await updateInspectionPlanning(id, IDLE, form(values))
  } catch (error) {
    if (error instanceof RedirectSignal) return error.target
    throw error
  }
}

beforeEach(() => {
  resetDemoInspections()
  vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'development')
})

afterEach(() => {
  send.mockReset()
  loadActiveUsers.mockReset()
  vi.unstubAllEnvs()
})

describe('validatePlanning', () => {
  it('exige tecnico, data e prioridade (RN-025)', () => {
    expect(validatePlanning({})).toMatchObject({
      technicianId: expect.any(String),
      scheduledDate: expect.any(String),
      priority: expect.any(String),
    })
    expect(validatePlanning(VALID)).toEqual({})
  })
})

describe('updateInspectionPlanning', () => {
  it('na demonstracao, salva o planejamento e registra no historico', async () => {
    expect(await submit(ASSIGNED_ID, VALID)).toBe(`/inspections/${ASSIGNED_ID}?notice=updated`)

    expect(await loadInspectionDetail(ASSIGNED_ID)).toMatchObject({
      technicianName: ANA.technicianName,
      supervisorName: ROBERTO.supervisorName,
      priority: 'CRITICAL',
      instructions: 'Levar escada.',
      status: 'ASSIGNED',
    })
    expect((await loadInspectionHistory(ASSIGNED_ID))?.at(-1)).toMatchObject({ action: 'INSPECTION_UPDATED', actorName: 'Mariana Costa' })
  })

  it('mantem o horario agendado quando a data nao muda', async () => {
    const before = await loadInspectionDetail(ASSIGNED_ID)
    const sameDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(before.scheduledFor))

    await submit(ASSIGNED_ID, { ...VALID, scheduledDate: sameDay })
    expect((await loadInspectionDetail(ASSIGNED_ID)).scheduledFor).toBe(before.scheduledFor)
  })

  it('atribui o rascunho ao escolher o tecnico', async () => {
    await submit(DRAFT_ID, VALID)
    expect((await loadInspectionDetail(DRAFT_ID)).status).toBe('ASSIGNED')
    expect((await loadInspectionHistory(DRAFT_ID))?.at(-1)).toMatchObject({ action: 'INSPECTION_ASSIGNED', newStatus: 'ASSIGNED' })
  })

  it('bloqueia a edicao depois do inicio da execucao', async () => {
    const result = await submit(IN_PROGRESS_ID, VALID)
    expect(result).toMatchObject({ status: 'error', message: expect.stringContaining('execução já foi iniciada') })
  })

  it('recusa tecnico que nao esta ativo (RN-027)', async () => {
    const result = await submit(ASSIGNED_ID, { ...VALID, technicianId: API_ID })
    expect(result).toMatchObject({ status: 'error', fieldErrors: { technicianId: expect.any(String) } })
  })

  it('fora da demonstracao, envia o PUT com a data no fuso da operacao', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'production')
    loadActiveUsers.mockImplementation(async (role: string) =>
      role === 'TECHNICIAN' ? [{ id: ANA.technicianId, name: ANA.technicianName }] : [],
    )

    expect(await submit(API_ID, { ...VALID, supervisorId: '' })).toBe(`/inspections/${API_ID}?notice=updated`)
    expect(send).toHaveBeenCalledWith(`/inspections/${API_ID}`, {
      method: 'PUT',
      body: {
        technicianId: ANA.technicianId,
        supervisorId: null,
        scheduledFor: '2026-12-01T00:00:00-03:00',
        priority: 'CRITICAL',
        instructions: 'Levar escada.',
      },
    })
  })
})
