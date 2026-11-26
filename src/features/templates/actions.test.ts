import { afterEach, describe, expect, it, vi } from 'vitest'

import { changeTemplateStatus, changeVersionAvailability, createTemplate } from '@/features/templates/actions'
import { ApiError } from '@/lib/api/errors'

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
  notFound: () => {
    throw new Error('not found')
  },
}))

const send = vi.fn()

vi.mock('@/lib/dal', () => ({
  requireRole: async () => ({ id: 'user-1', role: 'SUPERVISOR' }),
  load: vi.fn(),
  send: (path: string, request: unknown) => send(path, request),
  formError: (error: Error) => ({ status: 'error', message: error.message, fieldErrors: {}, values: {} }),
  actionError: (error: Error) => ({ ok: false, message: error.message }),
}))
vi.mock('@/features/catalog/lookups', () => ({ loadActiveUsers: async () => [], loadClients: async () => [] }))

function form(values: Record<string, string>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

async function redirectOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise
  } catch (error) {
    if (error instanceof RedirectSignal) return error.target
    throw error
  }
  throw new Error('esperava redirecionamento')
}

afterEach(() => {
  send.mockReset()
})

describe('createTemplate', () => {
  it('devolve os erros por campo sem chamar a API', async () => {
    const state = await createTemplate({ status: 'idle' }, form({ title: '', category: '' }))

    expect(state).toMatchObject({
      status: 'error',
      fieldErrors: { title: 'O título do modelo é obrigatório.', category: 'A categoria do modelo é obrigatória.' },
    })
    expect(send).not.toHaveBeenCalled()
  })

  it('envia o corpo do contrato e abre o construtor do modelo criado', async () => {
    send.mockResolvedValueOnce({ id: 'f0000000-0000-4000-8000-000000000001' })

    const target = await redirectOf(
      createTemplate({ status: 'idle' }, form({ title: ' Vistoria ', description: '', category: 'Predial' })),
    )

    expect(send).toHaveBeenCalledWith('/inspection-templates', {
      method: 'POST',
      body: { title: 'Vistoria', description: null, category: 'Predial' },
    })
    expect(target).toBe('/inspection-templates/f0000000-0000-4000-8000-000000000001/edit?notice=created')
  })
})

describe('changeTemplateStatus', () => {
  it('usa o PATCH de situacao', async () => {
    send.mockResolvedValueOnce({})

    const result = await changeTemplateStatus('f0000000-0000-4000-8000-000000000001', 'INACTIVE')

    expect(send).toHaveBeenCalledWith('/inspection-templates/f0000000-0000-4000-8000-000000000001/status', {
      method: 'PATCH',
      body: { status: 'INACTIVE' },
    })
    expect(result).toEqual({ ok: true, message: 'Modelo inativado. As inspeções existentes não foram afetadas.' })
  })

  it('devolve a recusa da API como mensagem', async () => {
    send.mockRejectedValueOnce(new ApiError({ status: 422, code: 'TEMPLATE_NOT_PUBLISHED', message: 'x' }))

    await expect(changeTemplateStatus('f0000000-0000-4000-8000-000000000001', 'INACTIVE')).resolves.toMatchObject({
      ok: false,
    })
  })

  it('recusa identificador que nao e UUID antes de chamar a API', async () => {
    await expect(changeTemplateStatus('../users', 'ACTIVE')).rejects.toThrow('Identificador invalido.')
    expect(send).not.toHaveBeenCalled()
  })
})

describe('changeVersionAvailability', () => {
  const VERSION = 'f0000000-0000-4000-8000-0000000000aa'

  it('libera a versao com o corpo do contrato', async () => {
    send.mockResolvedValueOnce({})

    const result = await changeVersionAvailability(VERSION, true)

    expect(send).toHaveBeenCalledWith(`/inspection-template-versions/${VERSION}/availability`, {
      method: 'PATCH',
      body: { activeForNewInspections: true },
    })
    expect(result).toEqual({ ok: true, message: 'Versão liberada para novos agendamentos.' })
  })

  it('retira a versao dos novos agendamentos', async () => {
    send.mockResolvedValueOnce({})

    const result = await changeVersionAvailability(VERSION, false)

    expect(send).toHaveBeenCalledWith(`/inspection-template-versions/${VERSION}/availability`, {
      method: 'PATCH',
      body: { activeForNewInspections: false },
    })
    expect(result).toMatchObject({ ok: true, message: expect.stringContaining('retirada') })
  })

  it('devolve a recusa da API como resultado', async () => {
    send.mockRejectedValueOnce(new ApiError({ status: 422, code: 'TEMPLATE_VERSION_NOT_PUBLISHED', message: 'x' }))

    await expect(changeVersionAvailability(VERSION, true)).resolves.toMatchObject({ ok: false })
  })

  it('recusa valor que nao e booleano e identificador malformado', async () => {
    await expect(changeVersionAvailability(VERSION, 'true' as unknown as boolean)).resolves.toEqual({
      ok: false,
      message: 'Situação inválida.',
    })
    await expect(changeVersionAvailability('abc', true)).rejects.toThrow('Identificador invalido.')
    expect(send).not.toHaveBeenCalled()
  })
})
