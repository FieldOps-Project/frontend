import { beforeEach, describe, expect, it, vi } from 'vitest'

import { changeVersionAvailability, createTemplate } from '@/features/templates/actions'
import { publishTemplate } from '@/features/templates/builder-actions'
import { capture, fail, mockApi, ok, recordRequests, server, signedInAs } from '@/test/api'
import { form, outcome, withSession } from '@/test/next'

vi.mock('server-only', () => ({}))
vi.mock('next/headers', async () => (await import('@/test/next')).nextHeaders)
vi.mock('next/navigation', async () => (await import('@/test/next')).nextNavigation)
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

/**
 * Fluxos 5 e 6 do documento 14.16: criacao de modelo e bloqueio de publicacao
 * invalida, pela rede (contrato do documento 12.9). A conferencia local e a
 * recusa da API (`422 TEMPLATE_PUBLISH_INVALID`) ficam em
 * `features/templates/publication-check.test.ts`.
 */
mockApi()

const TEMPLATE_ID = 'e0000000-0000-4000-8000-000000000099'
const SECTION_ID = 'e1000000-0000-4000-8000-000000000001'

/** Modelo pronto para publicar: uma secao com um item de conformidade (RN-016). */
const TEMPLATE = {
  id: TEMPLATE_ID,
  title: 'Inspeção de caldeiras',
  description: null,
  category: 'Equipamentos',
  status: 'DRAFT',
  currentVersion: null,
  createdBy: 'u-1',
  createdAt: '2026-11-20T12:00:00Z',
  updatedAt: '2026-11-20T12:00:00Z',
  version: 1,
  draftVersionId: null,
  sections: [
    {
      id: SECTION_ID,
      title: 'Segurança',
      description: null,
      displayOrder: 1,
      items: [
        {
          id: 'e2000000-0000-4000-8000-000000000001',
          sectionId: SECTION_ID,
          code: null,
          title: 'Válvula de segurança atua?',
          description: null,
          responseType: 'CONFORMITY',
          required: true,
          observationRequiredOnFailure: true,
          evidenceRequiredOnFailure: true,
          options: [],
          displayOrder: 1,
        },
      ],
    },
  ],
}

beforeEach(() => {
  withSession()
})

describe('5. criacao de modelo', () => {
  it('envia titulo, descricao e categoria e abre o construtor do modelo criado', async () => {
    const created = capture('post', '/inspection-templates', { id: TEMPLATE_ID }, 201)
    server.use(signedInAs('ADMIN'), created.handler)

    const result = await outcome(() =>
      createTemplate({ status: 'idle' }, form({ title: 'Inspeção de caldeiras', category: 'Equipamentos' })),
    )

    expect(result).toEqual({ redirectedTo: `/inspection-templates/${TEMPLATE_ID}/edit?notice=created` })
    expect(created.bodies).toEqual([{
      title: 'Inspeção de caldeiras',
      description: null,
      category: 'Equipamentos',
    }])
  })

  it('titulo repetido (409) volta como erro no campo de titulo', async () => {
    server.use(signedInAs('ADMIN'), fail('post', '/inspection-templates', 409, 'TEMPLATE_TITLE_ALREADY_EXISTS'))

    const { result } = await outcome(() =>
      createTemplate({ status: 'idle' }, form({ title: 'Inspeção de caldeiras', category: 'Equipamentos' })),
    )
    expect(result).toMatchObject({ status: 'error', fieldErrors: { title: 'Já existe um modelo com este título.' } })
  })
})

describe('disponibilidade da versao para novos agendamentos', () => {
  const VERSION_ID = 'e3000000-0000-4000-8000-000000000001'

  it('envia o corpo do contrato e confirma a mudanca', async () => {
    const patched = capture('patch', `/inspection-template-versions/${VERSION_ID}/availability`, {
      id: VERSION_ID,
      activeForNewInspections: false,
    })
    server.use(signedInAs('SUPERVISOR'), patched.handler)

    const { result } = await outcome(() => changeVersionAvailability(VERSION_ID, false))

    expect(patched.bodies).toEqual([{ activeForNewInspections: false }])
    expect(result).toMatchObject({ ok: true })
  })

  it.each([
    ['TEMPLATE_VERSION_NOT_PUBLISHED', 'Só versões publicadas podem ser liberadas para novas inspeções.'],
    ['INVALID_TEMPLATE_STATUS', 'Situação inválida: o modelo só pode ficar ativo ou inativo.'],
  ])('%s chega em portugues', async (code, message) => {
    server.use(
      signedInAs('ADMIN'),
      fail('patch', `/inspection-template-versions/${VERSION_ID}/availability`, 422, code),
    )

    const { result } = await outcome(() => changeVersionAvailability(VERSION_ID, true))

    expect(result).toEqual({ ok: false, message })
  })

  it('versao inexistente (404) vira mensagem de registro nao encontrado', async () => {
    server.use(
      signedInAs('ADMIN'),
      fail('patch', `/inspection-template-versions/${VERSION_ID}/availability`, 404, 'TEMPLATE_VERSION_NOT_FOUND'),
    )

    const { result } = await outcome(() => changeVersionAvailability(VERSION_ID, true))

    expect(result).toEqual({ ok: false, message: 'Registro não encontrado. Ele pode ter sido removido.' })
  })

  it('tecnico nem chega a chamar a API', async () => {
    server.use(signedInAs('TECHNICIAN'))
    const received = recordRequests()

    const { redirectedTo } = await outcome(() => changeVersionAvailability(VERSION_ID, true))

    expect(redirectedTo).toBe('/api/auth/denied')
    expect(received.some((request) => request.method === 'PATCH')).toBe(false)
  })
})

describe('6. bloqueio de publicacao invalida', () => {
  it('modelo sem secao nao chega a ser enviado para publicar', async () => {
    server.use(signedInAs('ADMIN'), ok('get', `/inspection-templates/${TEMPLATE_ID}`, { ...TEMPLATE, sections: [] }))
    const received = recordRequests()

    const { result } = await outcome(() => publishTemplate(TEMPLATE_ID))

    expect(result).toMatchObject({ ok: false })
    expect(result && !result.ok && result.issues?.length).toBeGreaterThan(0)
    expect(received.some((request) => request.path.endsWith('/publish'))).toBe(false)
  })

  it('a recusa da API (422 TEMPLATE_PUBLISH_INVALID) vira pendencia', async () => {
    server.use(
      signedInAs('ADMIN'),
      ok('get', `/inspection-templates/${TEMPLATE_ID}`, TEMPLATE),
      fail('post', `/inspection-templates/${TEMPLATE_ID}/publish`, 422, 'TEMPLATE_PUBLISH_INVALID', [
        { field: 'sections[0].items', message: 'must not be empty' },
      ]),
    )

    const { result } = await outcome(() => publishTemplate(TEMPLATE_ID))
    expect(result).toMatchObject({ ok: false })
    expect(result && !result.ok && result.issues?.length).toBeGreaterThan(0)
  })

  it('modelo valido e publicado com o numero da versao gerada', async () => {
    server.use(
      signedInAs('ADMIN'),
      ok('get', `/inspection-templates/${TEMPLATE_ID}`, TEMPLATE),
      ok('post', `/inspection-templates/${TEMPLATE_ID}/publish`, {
        id: 'v1',
        templateId: TEMPLATE_ID,
        versionNumber: 1,
        title: TEMPLATE.title,
        publishedBy: 'u-1',
        publishedAt: '2026-11-24T12:00:00Z',
        activeForNewInspections: true,
      }),
    )

    expect((await outcome(() => publishTemplate(TEMPLATE_ID))).result).toMatchObject({ ok: true, versionNumber: 1 })
  })
})
