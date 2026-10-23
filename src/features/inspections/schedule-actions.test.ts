import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createInspection } from '@/features/inspections/schedule-actions'
import { DEMO_TEMPLATE_VERSIONS } from '@/features/inspections/scheduling-data'

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

vi.mock('@/lib/dal', () => ({
  requireRole: async () => ({ role: 'SUPERVISOR' }),
  send: (path: string, request: unknown) => send(path, request),
  formError: (error: Error) => ({ status: 'error', message: error.message, fieldErrors: {}, values: {} }),
}))

const CLIENT = { id: 'c1', name: 'Indústria Alfa' }
const OTHER_CLIENT_SITE = { id: 's2', clientId: 'c2', name: 'Outro' }
const SITE = { id: 's1', clientId: 'c1', name: 'Unidade Sorocaba' }
const EQUIPMENT = { id: 'e1', siteId: 's1', name: 'HVAC Unit B' }
const OTHER_SITE_EQUIPMENT = { id: 'e2', siteId: 's2', name: 'Compressor' }
const TECHNICIAN = { id: 't1', name: 'Carlos Mendes' }

vi.mock('@/features/catalog/lookups', () => ({
  loadClients: async () => [CLIENT],
  loadSites: async () => [SITE, OTHER_CLIENT_SITE],
  loadEquipment: async () => [EQUIPMENT, OTHER_SITE_EQUIPMENT],
  loadActiveUsers: async (role: string) => (role === 'TECHNICIAN' ? [TECHNICIAN] : []),
}))

const [EQUIPMENT_MODEL, , SITE_MODEL] = DEMO_TEMPLATE_VERSIONS

function form(values: Record<string, string>) {
  const data = new FormData()
  for (const [name, value] of Object.entries(values)) data.set(name, value)
  return data
}

const VALID = {
  templateVersionId: EQUIPMENT_MODEL?.versionId ?? '',
  clientId: 'c1',
  siteId: 's1',
  equipmentId: 'e1',
  technicianId: 't1',
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

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'development')
})

afterEach(() => {
  send.mockReset()
  vi.unstubAllEnvs()
})

describe('createInspection', () => {
  it('devolve os obrigatorios no campo certo e preserva o que foi digitado', async () => {
    const { state } = await submit({ instructions: 'Levar escada.' })

    expect(state).toMatchObject({
      status: 'error',
      fieldErrors: {
        templateVersionId: 'Selecione um modelo publicado.',
        clientId: 'A seleção do cliente é obrigatória.',
        siteId: 'A seleção do local é obrigatória.',
        technicianId: 'A atribuição do técnico é obrigatória.',
        scheduledDate: 'A data prevista é obrigatória.',
      },
      values: { instructions: 'Levar escada.' },
    })
    expect(send).not.toHaveBeenCalled()
  })

  it('recusa local de outro cliente', async () => {
    const { state } = await submit({ ...VALID, siteId: 's2', equipmentId: 'e2' })

    expect(state).toMatchObject({
      fieldErrors: { siteId: 'O local não pertence ao cliente selecionado ou está inativo.' },
    })
  })

  it('recusa equipamento de outro local (RN-014)', async () => {
    const { state } = await submit({ ...VALID, equipmentId: 'e2' })

    expect(state).toMatchObject({
      fieldErrors: { equipmentId: 'O equipamento não pertence ao local selecionado ou está inativo.' },
    })
  })

  it('so atribui a tecnico ativo (RN-027)', async () => {
    const { state } = await submit({ ...VALID, technicianId: 'inativo' })

    expect(state).toMatchObject({ fieldErrors: { technicianId: 'Somente técnico ativo pode receber a inspeção.' } })
  })

  it('dispensa o equipamento quando o modelo inspeciona o local (RN-026)', async () => {
    const { state } = await submit({ ...VALID, templateVersionId: SITE_MODEL?.versionId ?? '', equipmentId: '' })

    expect(state?.status).toBe('success')
  })

  it('na demonstracao valida tudo e nao envia nada', async () => {
    const { state } = await submit(VALID)

    expect(state).toMatchObject({ status: 'success' })
    expect(send).not.toHaveBeenCalled()
  })

  it('fora da demonstracao recusa modelo que nao esta publicado', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'production')

    const { state } = await submit(VALID)

    expect(state).toMatchObject({
      fieldErrors: { templateVersionId: 'Este modelo não está disponível para novas inspeções.' },
    })
    expect(send).not.toHaveBeenCalled()
  })
})
