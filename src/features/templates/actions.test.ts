import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { changeTemplateStatus, createTemplate } from '@/features/templates/actions'
import { listDemoTemplates, resetDemoTemplates } from '@/features/templates/template-demo-store'

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
  vi.unstubAllEnvs()
})

describe('createTemplate', () => {
  it('devolve os erros por campo sem chamar a API', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'production')
    const state = await createTemplate({ status: 'idle' }, form({ title: '', category: '' }))

    expect(state).toMatchObject({
      status: 'error',
      fieldErrors: { title: 'O título do modelo é obrigatório.', category: 'A categoria do modelo é obrigatória.' },
    })
    expect(send).not.toHaveBeenCalled()
  })

  it('em desenvolvimento guarda o rascunho e abre o construtor', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'development')
    resetDemoTemplates()

    const target = await redirectOf(createTemplate({ status: 'idle' }, form({ title: 'Novo modelo', category: 'Testes' })))
    const [created] = listDemoTemplates({ category: 'Testes' })

    expect(created).toMatchObject({ title: 'Novo modelo', status: 'DRAFT', createdBy: 'user-1' })
    expect(target).toBe(`/inspection-templates/${created?.id}/edit?notice=created`)
  })

  it('com a API envia o corpo do contrato e abre o construtor do modelo criado', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'production')
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
  beforeEach(() => {
    resetDemoTemplates()
  })

  it('em desenvolvimento inativa modelo publicado', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'development')
    const [published] = listDemoTemplates({ status: 'ACTIVE' })

    const result = await changeTemplateStatus(published!.id, 'INACTIVE')

    expect(result).toEqual({ ok: true, message: 'Modelo inativado. As inspeções existentes não foram afetadas.' })
    expect(listDemoTemplates({ status: 'INACTIVE' }).some((t) => t.id === published!.id)).toBe(true)
  })

  it('em desenvolvimento recusa rascunho nunca publicado com mensagem', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'development')
    const [draft] = listDemoTemplates({ status: 'DRAFT' })

    await expect(changeTemplateStatus(draft!.id, 'INACTIVE')).resolves.toEqual({
      ok: false,
      message: 'Publique o modelo antes de mudar a situação dele.',
    })
  })

  it('com a API usa o PATCH de situacao', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'production')
    send.mockResolvedValueOnce({})

    await changeTemplateStatus('f0000000-0000-4000-8000-000000000001', 'ACTIVE')

    expect(send).toHaveBeenCalledWith('/inspection-templates/f0000000-0000-4000-8000-000000000001/status', {
      method: 'PATCH',
      body: { status: 'ACTIVE' },
    })
  })
})
