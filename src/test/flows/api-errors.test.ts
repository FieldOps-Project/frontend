import { describe, expect, it, vi } from 'vitest'

import { changeClientStatus, createClient } from '@/features/clients/actions'
import { load } from '@/lib/dal'
import { fail, mockApi, ok, server, signedInAs } from '@/test/api'
import { form, outcome, withSession } from '@/test/next'

vi.mock('server-only', () => ({}))
vi.mock('next/headers', async () => (await import('@/test/next')).nextHeaders)
vi.mock('next/navigation', async () => (await import('@/test/next')).nextNavigation)

/**
 * Fluxo 11 do documento 14.16: tratamento de erro da API. Cada status chega
 * pela rede e passa pelo codigo real -- cliente HTTP, DAL e traducao de
 * mensagens --, e o usuario so ve linguagem de negocio (documento 14, 8.3).
 */
mockApi()

const CLIENT_ID = '3d8dc050-54f4-4d3b-9e5d-5fdb29ae3ed5'
const NEW_CLIENT = { name: 'Indústria Alfa', document: '12345678000190', email: 'contato@alfa.test' }

describe('11. erros da API', () => {
  it('401 numa Server Action renova a sessao e repete a chamada uma unica vez', async () => {
    withSession()
    let attempts = 0
    const { http, HttpResponse } = await import('msw')
    server.use(
      signedInAs('ADMIN'),
      ok('post', '/auth/refresh', { accessToken: 'novo', refreshToken: 'novo-rt', expiresIn: 900 }),
      http.post('http://api.test/api/v1/clients', ({ request }) => {
        attempts += 1
        return request.headers.get('Authorization') === 'Bearer novo'
          ? HttpResponse.json({ id: 'c-1' }, { status: 201 })
          : HttpResponse.json({ status: 401, code: 'AUTH_INVALID_TOKEN', message: 'expired' }, { status: 401 })
      }),
    )

    expect(await outcome(() => createClient({ status: 'idle' }, form(NEW_CLIENT)))).toEqual({
      redirectedTo: '/clients?notice=created',
    })
    expect(attempts).toBe(2)
  })

  it('401 sem conseguir renovar leva ao login com o aviso de sessao expirada', async () => {
    withSession()
    server.use(
      signedInAs('ADMIN'),
      fail('post', '/auth/refresh', 401, 'AUTH_INVALID_REFRESH_TOKEN'),
      fail('post', '/clients', 401, 'AUTH_INVALID_TOKEN'),
    )

    expect(await outcome(() => createClient({ status: 'idle' }, form(NEW_CLIENT)))).toEqual({
      redirectedTo: '/login?expired=1',
    })
  })

  it('403 numa leitura leva a pagina de acesso negado', async () => {
    withSession()
    server.use(fail('get', '/users', 403, 'AUTH_FORBIDDEN'))

    expect(await outcome(() => load('/users'))).toEqual({ redirectedTo: '/forbidden' })
  })

  it('403 numa acao de botao vira mensagem de negocio', async () => {
    withSession()
    server.use(signedInAs('SUPERVISOR'), fail('patch', `/clients/${CLIENT_ID}/status`, 403, 'AUTH_FORBIDDEN'))

    expect((await outcome(() => changeClientStatus(CLIENT_ID, 'INACTIVE'))).result).toEqual({
      ok: false,
      message: 'Seu perfil não tem permissão para esta ação.',
    })
  })

  it('409 de e-mail duplicado aparece no campo de e-mail, sem o codigo tecnico', async () => {
    withSession()
    server.use(signedInAs('ADMIN'), fail('post', '/clients', 409, 'EMAIL_ALREADY_EXISTS'))

    const { result } = await outcome(() => createClient({ status: 'idle' }, form(NEW_CLIENT)))

    expect(result).toMatchObject({
      status: 'error',
      fieldErrors: { email: 'Este e-mail já está cadastrado.' },
      values: { email: 'contato@alfa.test', name: 'Indústria Alfa' },
    })
    expect(JSON.stringify(result)).not.toMatch(/EMAIL_ALREADY_EXISTS|Technical message/)
  })

  it('422 leva cada fieldError ao campo certo e preserva o que foi digitado', async () => {
    withSession()
    server.use(
      signedInAs('ADMIN'),
      fail('post', '/clients', 422, 'VALIDATION_ERROR', [
        { field: 'document', message: 'must be a valid CPF or CNPJ' },
        { field: 'name', message: 'must not be blank' },
      ]),
    )

    const { result } = await outcome(() => createClient({ status: 'idle' }, form(NEW_CLIENT)))

    expect(result).toMatchObject({ status: 'error', message: 'Revise os campos destacados.' })
    const fieldErrors = (result as { fieldErrors: Record<string, string> }).fieldErrors
    expect(Object.keys(fieldErrors).sort()).toEqual(['document', 'name'])
    expect(Object.values(fieldErrors).join(' ')).not.toMatch(/must /)
  })

  it('API fora do ar vira aviso compreensivel', async () => {
    withSession()
    const { http, HttpResponse } = await import('msw')
    server.use(signedInAs('ADMIN'), http.post('http://api.test/api/v1/clients', () => HttpResponse.error()))

    const { result } = await outcome(() => createClient({ status: 'idle' }, form(NEW_CLIENT)))
    expect(result).toMatchObject({ status: 'error', message: expect.stringContaining('Não foi possível falar com a API') })
  })
})
