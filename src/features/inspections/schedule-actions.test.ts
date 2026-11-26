import { afterEach, describe, expect, it, vi } from 'vitest'

import { createInspection } from '@/features/inspections/schedule-actions'
import { ApiError } from '@/lib/api/errors'
import { INSTRUCTIONS_MAX_LENGTH, TITLE_MAX_LENGTH } from '@/features/inspections/schedule-validation'

vi.mock('server-only', () => ({}))

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
const requireRole = vi.fn()

vi.mock('@/lib/dal', () => ({
  requireRole: (roles: readonly string[]) => requireRole(roles),
  send: (path: string, request: unknown) => send(path, request),
  formError: (error: ApiError, values: Record<string, string>) => ({
    status: 'error',
    message: error.message,
    fieldErrors: Object.fromEntries(error.fieldErrors.map(({ field, message }) => [field, message])),
    values,
  }),
}))

function form(values: Record<string, string>) {
  const data = new FormData()
  for (const [name, value] of Object.entries(values)) data.set(name, value)
  return data
}

const VALID = {
  templateVersionId: 'v1',
  clientId: 'c1',
  siteId: 's1',
  equipmentId: 'e1',
  technicianId: 't1',
  supervisorId: 'u1',
  title: 'Inspeção preventiva do gerador',
  scheduledDate: '2026-11-03',
  priority: 'HIGH',
  instructions: 'Levar escada.',
}

async function submit(values: Record<string, string>) {
  try {
    return { state: await createInspection({ status: 'idle' }, form(values)) }
  } catch (error) {
    if (error instanceof RedirectSignal) return { redirectedTo: error.target }
    throw error
  }
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('createInspection', () => {
  it('exige o perfil de quem agenda', async () => {
    await submit(VALID)

    expect(requireRole).toHaveBeenCalledWith(['ADMIN', 'SUPERVISOR'])
  })

  it('devolve os obrigatorios no campo certo e preserva o que foi digitado', async () => {
    const { state } = await submit({ instructions: 'Levar escada.' })

    expect(state).toMatchObject({
      status: 'error',
      fieldErrors: {
        templateVersionId: 'Selecione um modelo publicado.',
        clientId: 'A seleção do cliente é obrigatória.',
        siteId: 'A seleção do local é obrigatória.',
        technicianId: 'A atribuição do técnico é obrigatória.',
        title: 'O título é obrigatório.',
        scheduledDate: 'A data prevista é obrigatória.',
      },
      values: { instructions: 'Levar escada.' },
    })
    expect(send).not.toHaveBeenCalled()
  })

  it('respeita os limites de titulo e instrucoes da API', async () => {
    const { state } = await submit({
      ...VALID,
      title: 'a'.repeat(TITLE_MAX_LENGTH + 1),
      instructions: 'a'.repeat(INSTRUCTIONS_MAX_LENGTH + 1),
    })

    expect(state).toMatchObject({
      fieldErrors: {
        title: `Use no máximo ${TITLE_MAX_LENGTH} caracteres.`,
        instructions: `Use no máximo ${INSTRUCTIONS_MAX_LENGTH} caracteres.`,
      },
    })
  })

  it('envia o agendamento no contrato da API, com titulo e data no fuso da operacao', async () => {
    const { redirectedTo } = await submit(VALID)

    expect(redirectedTo).toBe('/inspections?notice=scheduled')
    expect(send).toHaveBeenCalledWith('/inspections', {
      method: 'POST',
      body: {
        templateVersionId: 'v1',
        clientId: 'c1',
        siteId: 's1',
        equipmentId: 'e1',
        technicianId: 't1',
        supervisorId: 'u1',
        title: 'Inspeção preventiva do gerador',
        instructions: 'Levar escada.',
        priority: 'HIGH',
        scheduledFor: '2026-11-03T00:00:00-03:00',
      },
    })
  })

  it('manda equipamento, supervisor e instrucoes como nulos quando nao informados', async () => {
    await submit({ ...VALID, equipmentId: '', supervisorId: '', instructions: '' })

    expect(send).toHaveBeenCalledWith('/inspections', {
      method: 'POST',
      body: expect.objectContaining({ equipmentId: null, supervisorId: null, instructions: null }),
    })
  })

  it('leva o erro de equipamento obrigatorio da API para o campo, sem checar a regra no servidor do painel', async () => {
    send.mockRejectedValue(
      new ApiError({
        status: 422,
        code: 'EQUIPMENT_REQUIRED',
        message: 'Este modelo exige um equipamento.',
        fieldErrors: [{ field: 'equipmentId', message: 'Este modelo exige um equipamento.' }],
      }),
    )

    const { state } = await submit({ ...VALID, equipmentId: '' })

    expect(state).toMatchObject({ status: 'error', fieldErrors: { equipmentId: 'Este modelo exige um equipamento.' } })
  })

  it('mostra o erro de scheduledFor da API no campo de data', async () => {
    send.mockRejectedValue(
      new ApiError({
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Revise os campos destacados.',
        fieldErrors: [{ field: 'scheduledFor', message: 'must not be null' }],
      }),
    )

    const { state } = await submit(VALID)

    expect(state).toMatchObject({ fieldErrors: { scheduledDate: 'must not be null' } })
  })
})
