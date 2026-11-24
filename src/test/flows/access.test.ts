import { describe, expect, it, vi } from 'vitest'

import { createClient } from '@/features/clients/actions'
import { createUser } from '@/features/users/actions'
import { requireRole, verifySession } from '@/lib/dal'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { fail, mockApi, ok, server, signedInAs } from '@/test/api'
import { cookieJar, form, outcome, withoutSession, withSession } from '@/test/next'

vi.mock('server-only', () => ({}))
vi.mock('next/headers', async () => (await import('@/test/next')).nextHeaders)
vi.mock('next/navigation', async () => (await import('@/test/next')).nextNavigation)

/**
 * Fluxos 1 e 2 do documento 14.16: protecao de rota sem sessao e permissao por
 * perfil. A sessao e confirmada na API (`GET /auth/me`) pelo codigo real da
 * DAL; o menu por perfil fica em `lib/navigation.test.ts` e o desvio barato do
 * proxy em `proxy.test.ts`.
 */
mockApi()

const NEW_CLIENT = { name: 'Indústria Alfa', document: '12345678000190' }

describe('1. protecao de rota sem sessao', () => {
  it('sem cookie de sessao, leva a renovacao e nao chama a API', async () => {
    withoutSession()
    expect(await outcome(() => verifySession())).toEqual({
      redirectedTo: '/api/auth/refresh?redirect=%2Fdashboard',
    })
  })

  it('token recusado pela API (401) leva a renovacao da sessao', async () => {
    withSession()
    server.use(fail('get', '/auth/me', 401, 'AUTH_INVALID_TOKEN'))

    expect((await outcome(() => verifySession())).redirectedTo).toMatch(/^\/api\/auth\/refresh/)
  })

  it('logo depois de renovar, novo 401 volta ao login em vez de renovar em laco', async () => {
    withSession()
    cookieJar.set('fo_rf', '1')
    server.use(fail('get', '/auth/me', 401, 'AUTH_INVALID_TOKEN'))

    expect(await outcome(() => verifySession())).toEqual({ redirectedTo: '/login?expired=1' })
  })

  it('Server Action sem sessao nao chega a API', async () => {
    withoutSession()
    const result = await outcome(() => createClient({ status: 'idle' }, form(NEW_CLIENT)))
    expect(result.redirectedTo).toMatch(/^\/api\/auth\/refresh/)
  })
})

describe('2. permissoes por perfil', () => {
  it('tecnico tem a sessao encerrada no painel (matriz 5.2)', async () => {
    withSession()
    server.use(signedInAs('TECHNICIAN'))

    expect(await outcome(() => verifySession())).toEqual({ redirectedTo: '/api/auth/denied' })
  })

  it('perfil fora da lista vai para acesso negado (403 nao e 401)', async () => {
    withSession()
    server.use(signedInAs('SUPERVISOR'))

    expect(await outcome(() => requireRole(['ADMIN']))).toEqual({ redirectedTo: '/forbidden' })
    expect((await outcome(() => requireRole(MANAGER_ROLES))).result?.role).toBe('SUPERVISOR')
  })

  it('supervisor nao cria usuario: a Server Action recusa antes de chamar a API', async () => {
    withSession()
    let called = false
    server.use(
      signedInAs('SUPERVISOR'),
      ok('post', '/users', {}),
    )
    server.events.on('request:start', ({ request }) => {
      if (request.method === 'POST') called = true
    })

    const result = await outcome(() =>
      createUser({ status: 'idle' }, form({ name: 'Nova Pessoa', email: 'nova@fieldops.test', role: 'TECHNICIAN', password: 'Str0ngP@ss' })),
    )

    expect(result).toEqual({ redirectedTo: '/forbidden' })
    expect(called).toBe(false)
    server.events.removeAllListeners()
  })

  it('administrador cria usuario e volta a lista com o aviso', async () => {
    withSession()
    server.use(signedInAs('ADMIN'), ok('post', '/users', { id: 'u-2' }, 201))

    const result = await outcome(() =>
      createUser({ status: 'idle' }, form({ name: 'Nova Pessoa', email: 'nova@fieldops.test', role: 'TECHNICIAN', password: 'Str0ngP@ss' })),
    )

    expect(result).toEqual({ redirectedTo: '/users?notice=created' })
  })
})
