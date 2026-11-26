import { afterEach, describe, expect, it, vi } from 'vitest'

import { updateInspectionPlanning } from '@/features/inspections/planning-actions'
import { validatePlanning } from '@/features/inspections/planning-validation'
import { ApiError } from '@/lib/api/errors'
import { IDLE } from '@/lib/form-state'

vi.mock('server-only', () => ({}))

const revalidatePath = vi.fn()
vi.mock('next/cache', () => ({ revalidatePath: (path: string) => revalidatePath(path) }))

class RedirectSignal extends Error {
  constructor(readonly target: string) {
    super(`redirect to ${target}`)
  }
}

vi.mock('next/navigation', () => ({
  redirect: (target: string) => {
    throw new RedirectSignal(target)
  },
}))

const send = vi.fn()
const loadInspectionRecord = vi.fn()

vi.mock('@/features/inspections/detail-data', () => ({
  loadInspectionRecord: (id: string) => loadInspectionRecord(id),
}))

vi.mock('@/lib/dal', () => ({
  requireRole: async () => ({ id: 'u1', name: 'Mariana Costa', email: 'm@fieldops.dev', role: 'SUPERVISOR' }),
  send: (path: string, request: unknown) => send(path, request),
  formError: (error: ApiError, values: Record<string, string>) => ({
    status: 'error',
    message: error.message,
    fieldErrors: Object.fromEntries(error.fieldErrors.map(({ field, message }) => [field, message])),
    values,
  }),
}))

const ID = '3d8dc050-54f4-4d3b-9e5d-5fdb29ae3ed5'

const RECORD = {
  id: ID,
  clientId: 'c1',
  siteId: 's1',
  equipmentId: 'e1',
  status: 'ASSIGNED',
  scheduledFor: '2026-11-20T15:00:00Z',
}

const VALID = {
  title: 'Inspeção preventiva do gerador',
  technicianId: 't1',
  supervisorId: 'u2',
  scheduledDate: '2026-12-01',
  priority: 'CRITICAL',
  instructions: 'Levar escada.',
}

function form(values: Record<string, string>) {
  const data = new FormData()
  for (const [name, value] of Object.entries(values)) data.set(name, value)
  return data
}

async function submit(values: Record<string, string>) {
  try {
    return await updateInspectionPlanning(ID, IDLE, form(values))
  } catch (error) {
    if (error instanceof RedirectSignal) return error.target
    throw error
  }
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('validatePlanning', () => {
  it('exige titulo, tecnico, data e prioridade (RN-025)', () => {
    expect(validatePlanning({})).toMatchObject({
      title: expect.any(String),
      technicianId: expect.any(String),
      scheduledDate: expect.any(String),
      priority: expect.any(String),
    })
    expect(validatePlanning(VALID)).toEqual({})
  })
})

describe('updateInspectionPlanning', () => {
  it('nao chama a API quando o formulario esta invalido e preserva o que foi digitado', async () => {
    const result = await submit({ ...VALID, title: '', technicianId: '' })

    expect(result).toMatchObject({
      status: 'error',
      fieldErrors: { title: 'O título é obrigatório.', technicianId: 'A atribuição do técnico é obrigatória.' },
      values: { instructions: 'Levar escada.' },
    })
    expect(send).not.toHaveBeenCalled()
  })

  it('envia o PUT com o planejamento completo, mantendo cliente, local e equipamento', async () => {
    loadInspectionRecord.mockResolvedValue(RECORD)

    expect(await submit(VALID)).toBe(`/inspections/${ID}?notice=updated`)
    expect(send).toHaveBeenCalledWith(`/inspections/${ID}`, {
      method: 'PUT',
      body: {
        clientId: 'c1',
        siteId: 's1',
        equipmentId: 'e1',
        technicianId: 't1',
        supervisorId: 'u2',
        title: 'Inspeção preventiva do gerador',
        instructions: 'Levar escada.',
        priority: 'CRITICAL',
        scheduledFor: '2026-12-01T00:00:00-03:00',
      },
    })
    expect(revalidatePath).toHaveBeenCalledWith(`/inspections/${ID}`)
  })

  it('mantem o equipamento nulo das inspecoes do local e manda supervisor e instrucoes nulos', async () => {
    loadInspectionRecord.mockResolvedValue({ ...RECORD, equipmentId: null })

    await submit({ ...VALID, supervisorId: '', instructions: '' })

    expect(send).toHaveBeenCalledWith(`/inspections/${ID}`, {
      method: 'PUT',
      body: expect.objectContaining({ equipmentId: null, supervisorId: null, instructions: null }),
    })
  })

  it('mantem o horario agendado quando a data nao muda', async () => {
    loadInspectionRecord.mockResolvedValue(RECORD)

    await submit({ ...VALID, scheduledDate: '2026-11-20' })

    expect(send).toHaveBeenCalledWith(`/inspections/${ID}`, {
      method: 'PUT',
      body: expect.objectContaining({ scheduledFor: '2026-11-20T15:00:00Z' }),
    })
  })

  it('devolve ao campo o erro de tecnico recusado pela API (RN-027)', async () => {
    loadInspectionRecord.mockResolvedValue(RECORD)
    send.mockRejectedValue(
      new ApiError({
        status: 422,
        code: 'INVALID_TECHNICIAN',
        message: 'Escolha um técnico ativo.',
        fieldErrors: [{ field: 'technicianId', message: 'Escolha um técnico ativo.' }],
      }),
    )

    expect(await submit(VALID)).toMatchObject({ status: 'error', fieldErrors: { technicianId: 'Escolha um técnico ativo.' } })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('devolve a recusa da API quando a execucao ja comecou', async () => {
    loadInspectionRecord.mockResolvedValue({ ...RECORD, status: 'IN_PROGRESS' })
    send.mockRejectedValue(
      new ApiError({
        status: 422,
        code: 'INSPECTION_NOT_EDITABLE',
        message: 'O planejamento não pode mais ser alterado: a execução já foi iniciada.',
      }),
    )

    expect(await submit(VALID)).toMatchObject({
      status: 'error',
      message: 'O planejamento não pode mais ser alterado: a execução já foi iniciada.',
    })
  })

  it('leva o erro de scheduledFor da API para o campo de data', async () => {
    loadInspectionRecord.mockResolvedValue(RECORD)
    send.mockRejectedValue(
      new ApiError({
        status: 422,
        code: 'SCHEDULED_FOR_REQUIRED',
        message: 'Informe a data prevista da inspeção.',
        fieldErrors: [{ field: 'scheduledFor', message: 'Informe a data prevista da inspeção.' }],
      }),
    )

    expect(await submit(VALID)).toMatchObject({ fieldErrors: { scheduledDate: 'Informe a data prevista da inspeção.' } })
  })
})
