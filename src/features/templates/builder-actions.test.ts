import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  createItem,
  createSection,
  publishTemplate,
  reorderItems,
  updateItem,
  updateTemplateInfo,
} from '@/features/templates/builder-actions'
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

const MACHINES = 'e0000000-0000-4000-8000-000000000004'
const SECTION = 'f1000000-0000-4000-8000-000000000001'
const ITEM_ID = 'f2000000-0000-4000-8000-000000000001'

const ITEM: ItemInput = {
  code: null,
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
})

describe('updateTemplateInfo', () => {
  it('envia titulo, descricao e categoria pelo PUT do modelo', async () => {
    send.mockResolvedValueOnce({})

    const state = await updateTemplateInfo(MACHINES, { status: 'idle' }, form({ title: 'Máquinas', category: 'Frota' }))

    expect(state).toEqual({ status: 'success', message: 'Dados do modelo salvos.' })
    expect(send).toHaveBeenCalledWith(`/inspection-templates/${MACHINES}`, {
      method: 'PUT',
      body: { title: 'Máquinas', description: null, category: 'Frota' },
    })
  })

  it('recusa configuracao sem titulo com erro no campo, sem chamar a API', async () => {
    const state = await updateTemplateInfo(MACHINES, { status: 'idle' }, form({ title: '', category: 'Frota' }))

    expect(state).toMatchObject({ status: 'error', fieldErrors: { title: 'O título do modelo é obrigatório.' } })
    expect(send).not.toHaveBeenCalled()
  })
})

describe('rascunho', () => {
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

  it('limpa o item para o tipo antes de enviar e mantem o codigo informado', async () => {
    send.mockResolvedValueOnce({ id: ITEM_ID })

    await createItem(MACHINES, SECTION, { ...ITEM, code: ' EXT-03 ' })

    expect(send).toHaveBeenCalledWith(`/inspection-templates/${MACHINES}/sections/${SECTION}/items`, {
      method: 'POST',
      body: {
        code: 'EXT-03',
        title: 'Buzina funcionando?',
        description: null,
        responseType: 'NUMBER',
        required: true,
        observationRequiredOnFailure: false,
        evidenceRequiredOnFailure: false,
        options: [],
      },
    })
  })

  it('editar o item reenvia o codigo para a API nao apaga-lo', async () => {
    send.mockResolvedValueOnce({ id: ITEM_ID })

    await updateItem(MACHINES, ITEM_ID, { ...ITEM, code: 'GER-GER-002' })

    expect(send).toHaveBeenCalledWith(
      `/inspection-templates/${MACHINES}/items/${ITEM_ID}`,
      expect.objectContaining({ method: 'PUT', body: expect.objectContaining({ code: 'GER-GER-002' }) }),
    )
  })

  it('codigo em branco vira nulo', async () => {
    send.mockResolvedValueOnce({ id: ITEM_ID })

    await updateItem(MACHINES, ITEM_ID, { ...ITEM, code: '   ' })

    expect(send).toHaveBeenCalledWith(
      `/inspection-templates/${MACHINES}/items/${ITEM_ID}`,
      expect.objectContaining({ body: expect.objectContaining({ code: null }) }),
    )
  })

  it('codigo acima de 50 caracteres volta como erro no campo, sem chamar a API', async () => {
    const result = await createItem(MACHINES, SECTION, { ...ITEM, code: 'x'.repeat(51) })

    expect(result).toMatchObject({ ok: false, fieldErrors: { code: 'Use no máximo 50 caracteres.' } })
    expect(send).not.toHaveBeenCalled()
  })

  it('devolve os erros por campo do item sem chamar a API', async () => {
    const result = await createItem(MACHINES, SECTION, { ...ITEM, responseType: 'SINGLE_CHOICE', options: ['Bom'] })

    expect(result).toMatchObject({
      ok: false,
      fieldErrors: { options: 'Informe ao menos 2 opções, sem deixar opção em branco.' },
    })
    expect(send).not.toHaveBeenCalled()
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

  it('junta os erros indexados das opcoes e o erro do codigo vindos da API', async () => {
    send.mockRejectedValueOnce(
      new ApiError({
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'invalid',
        fieldErrors: [
          { field: 'options[1]', message: 'must not be blank' },
          { field: 'code', message: 'size must be between 0 and 50' },
        ],
      }),
    )

    const result = await createItem(MACHINES, SECTION, { ...ITEM, responseType: 'SINGLE_CHOICE', options: ['Bom', 'Ruim'] })

    expect(result).toMatchObject({
      ok: false,
      fieldErrors: { options: 'Campo obrigatório.', code: 'Use no máximo 50 caracteres.' },
    })
  })
})

describe('publishTemplate', () => {
  const READY = {
    id: MACHINES,
    title: 'Máquinas',
    category: 'Frota',
    currentVersion: 1,
    sections: [
      {
        id: 's1',
        title: 'Freios',
        description: null,
        displayOrder: 1,
        items: [
          {
            id: 'i1',
            sectionId: 's1',
            code: null,
            title: 'Pastilhas',
            description: null,
            responseType: 'CONFORMITY',
            required: true,
            observationRequiredOnFailure: false,
            evidenceRequiredOnFailure: false,
            options: [],
            displayOrder: 1,
          },
        ],
      },
    ],
  }

  it('devolve as pendencias locais sem publicar', async () => {
    load.mockResolvedValueOnce({
      ...READY,
      sections: [...READY.sections, { id: 's2', title: 'Vazia', description: null, displayOrder: 2, items: [] }],
    })

    const result = await publishTemplate(MACHINES)

    expect(result).toMatchObject({ ok: false, issues: [{ message: 'A seção 2 “Vazia” não tem itens.' }] })
    expect(send).not.toHaveBeenCalled()
  })

  it('publica o rascunho pronto e informa o numero da versao', async () => {
    load.mockResolvedValueOnce(READY)
    send.mockResolvedValueOnce({ versionNumber: 2 })

    await expect(publishTemplate(MACHINES)).resolves.toEqual({ ok: true, message: 'Versão 2 publicada.', versionNumber: 2 })
    expect(send).toHaveBeenCalledWith(`/inspection-templates/${MACHINES}/publish`, { method: 'POST' })
  })

  it('mostra as pendencias que a API devolver', async () => {
    load.mockResolvedValueOnce(READY)
    send.mockRejectedValueOnce(
      new ApiError({
        status: 422,
        code: 'TEMPLATE_PUBLISH_INVALID',
        message: 'pending',
        fieldErrors: [{ field: 'sections[0].items[0].responseType', message: 'Response type PHOTO is not supported by the mobile app' }],
      }),
    )

    const result = await publishTemplate(MACHINES)

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
