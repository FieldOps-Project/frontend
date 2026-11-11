import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createItem,
  createSection,
  deleteItem,
  publishTemplate,
  reorderItems,
  reorderSections,
  updateTemplateInfo,
} from '@/features/templates/builder-actions'
import { demoTemplateId, findDemoTemplate, resetDemoTemplates } from '@/features/templates/template-demo-store'
import { demoDraftSections, resetDemoDrafts } from '@/features/templates/template-draft-demo-store'
import { ApiError } from '@/lib/api/errors'
import type { ItemInput } from '@/lib/domain/template-builder'

vi.mock('server-only', () => ({}))
vi.mock('next/navigation', () => ({ redirect: vi.fn(), notFound: vi.fn() }))

const send = vi.fn()
const load = vi.fn()

vi.mock('@/lib/dal', () => ({
  requireRole: async () => ({ id: 'user-1', role: 'SUPERVISOR' }),
  load: (path: string, query: unknown) => load(path, query),
  send: (path: string, request: unknown) => send(path, request),
  formError: (error: Error) => ({ status: 'error', message: error.message, fieldErrors: {}, values: {} }),
}))
vi.mock('@/features/catalog/lookups', () => ({ loadActiveUsers: async () => [], loadClients: async () => [] }))

const MACHINES = demoTemplateId(4)
const ITEM: ItemInput = {
  title: ' Buzina funcionando? ',
  description: '  ',
  responseType: 'NUMBER',
  required: true,
  observationRequiredOnFailure: true,
  evidenceRequiredOnFailure: false,
  options: ['sobra'],
}

function form(values: Record<string, string>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

afterEach(() => {
  send.mockReset()
  load.mockReset()
  vi.unstubAllEnvs()
})

describe('em desenvolvimento', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'development')
    resetDemoTemplates()
    resetDemoDrafts()
  })

  it('salva a configuracao do modelo', async () => {
    const state = await updateTemplateInfo(MACHINES, { status: 'idle' }, form({ title: 'Máquinas', category: 'Frota' }))

    expect(state).toEqual({ status: 'success', message: 'Dados do modelo salvos.' })
    expect(findDemoTemplate(MACHINES)).toMatchObject({ title: 'Máquinas', category: 'Frota', description: null })
  })

  it('recusa configuracao sem titulo com erro no campo', async () => {
    const state = await updateTemplateInfo(MACHINES, { status: 'idle' }, form({ title: '', category: 'Frota' }))
    expect(state).toMatchObject({ status: 'error', fieldErrors: { title: 'O título do modelo é obrigatório.' } })
  })

  it('adiciona secao no fim e item limpo para o tipo', async () => {
    const section = await createSection(MACHINES, { title: ' Freios ' })
    expect(section).toMatchObject({ ok: true, message: 'Seção “Freios” adicionada.' })
    if (!section.ok) return

    const item = await createItem(MACHINES, section.data.id, ITEM)
    expect(item).toMatchObject({
      ok: true,
      data: {
        title: 'Buzina funcionando?',
        description: null,
        observationRequiredOnFailure: false,
        options: [],
        displayOrder: 1,
      },
    })
  })

  it('devolve os erros por campo do item sem salvar', async () => {
    const [section] = demoDraftSections(MACHINES)
    const result = await createItem(MACHINES, section!.id, { ...ITEM, responseType: 'SINGLE_CHOICE', options: ['Bom'] })

    expect(result).toMatchObject({
      ok: false,
      fieldErrors: { options: 'Informe ao menos 2 opções, sem deixar opção em branco.' },
    })
    expect(demoDraftSections(MACHINES)[0]?.items).toHaveLength(2)
  })

  it('exclui e reordena com a lista completa', async () => {
    const [first, second, third] = demoDraftSections(MACHINES)
    await deleteItem(MACHINES, first!.items[0]!.id)
    expect(demoDraftSections(MACHINES)[0]?.items).toHaveLength(1)

    await expect(reorderSections(MACHINES, [third!.id, second!.id, first!.id])).resolves.toMatchObject({ ok: true })
    expect(demoDraftSections(MACHINES).map((section) => section.title)).toEqual([
      'Segurança e Cabine',
      'Sistema Hidráulico',
      'Identificação do Equipamento',
    ])
  })

  it('transforma a recusa da demonstracao em mensagem', async () => {
    const [section] = demoDraftSections(MACHINES)
    await expect(reorderItems(MACHINES, section!.id, [section!.items[0]!.id])).resolves.toEqual({
      ok: false,
      message: 'A nova ordem precisa conter todos os itens da seção, sem repetir.',
      fieldErrors: {},
    })
  })
})

describe('com a API', () => {
  const SECTION = 'f1000000-0000-4000-8000-000000000001'

  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'production')
  })

  it('usa os endpoints de rascunho com o corpo do contrato', async () => {
    send.mockResolvedValue({ id: SECTION, title: 'Freios' })

    await createSection(MACHINES, { title: 'Freios' })
    await reorderItems(MACHINES, SECTION, [SECTION])

    expect(send).toHaveBeenCalledWith(`/inspection-templates/${MACHINES}/sections`, {
      method: 'POST',
      body: { title: 'Freios', description: null },
    })
    expect(send).toHaveBeenCalledWith(`/inspection-templates/${MACHINES}/sections/${SECTION}/items/order`, {
      method: 'PUT',
      body: { itemIds: [SECTION] },
    })
  })

  it('leva a recusa da API ao campo do item', async () => {
    send.mockRejectedValueOnce(new ApiError({ status: 400, code: 'TEMPLATE_ITEM_OPTIONS_DUPLICATED', message: 'dup' }))

    const result = await createItem(MACHINES, SECTION, { ...ITEM, responseType: 'SINGLE_CHOICE', options: ['Bom', 'Ruim'] })

    expect(result).toEqual({
      ok: false,
      message: 'As opções da escolha única não podem se repetir.',
      fieldErrors: { options: 'As opções da escolha única não podem se repetir.' },
    })
  })
})

describe('publishTemplate', () => {
  it('em desenvolvimento publica o rascunho pronto e informa o numero', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'development')
    resetDemoTemplates()
    resetDemoDrafts()

    await expect(publishTemplate(MACHINES)).resolves.toEqual({ ok: true, message: 'Versão 3 publicada.', versionNumber: 3 })
    expect(findDemoTemplate(MACHINES)?.currentVersion).toBe(3)
  })

  it('devolve as pendencias locais sem publicar', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'development')
    resetDemoTemplates()
    resetDemoDrafts()
    await createSection(MACHINES, { title: 'Vazia' })

    const result = await publishTemplate(MACHINES)

    expect(result).toMatchObject({ ok: false, issues: [{ message: 'A seção 4 “Vazia” não tem itens.' }] })
    expect(findDemoTemplate(MACHINES)?.currentVersion).toBe(2)
  })

  it('com a API mostra as pendencias que ela devolver', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'production')
    load.mockResolvedValueOnce({
      id: MACHINES,
      title: 'Máquinas',
      category: 'Frota',
      currentVersion: 1,
      sections: [{ id: 's1', title: 'Freios', description: null, displayOrder: 1, items: [{ id: 'i1', sectionId: 's1', code: null, title: 'Pastilhas', description: null, responseType: 'CONFORMITY', required: true, observationRequiredOnFailure: false, evidenceRequiredOnFailure: false, options: [], displayOrder: 1 }] }],
    })
    send.mockRejectedValueOnce(
      new ApiError({
        status: 422,
        code: 'TEMPLATE_PUBLISH_INVALID',
        message: 'pending',
        fieldErrors: [{ field: 'sections[0].items[0].responseType', message: 'not supported' }],
      }),
    )

    const result = await publishTemplate(MACHINES)

    expect(send).toHaveBeenCalledWith(`/inspection-templates/${MACHINES}/publish`, { method: 'POST' })
    expect(result).toEqual({
      ok: false,
      message: 'O modelo tem pendências que impedem a publicação.',
      issues: [
        {
          message: 'Item 1.1 “Pastilhas”: o tipo de resposta não é suportado pelo aplicativo (RN-023).',
          target: { kind: 'item', id: 'i1' },
        },
      ],
    })
  })
})
