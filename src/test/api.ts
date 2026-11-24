import { http, HttpResponse, type JsonBodyType, type RequestHandler } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest'

/**
 * API simulada no nivel de rede (issue #25).
 *
 * O MSW intercepta o `fetch` de verdade: o cliente HTTP, a camada de acesso a
 * dados e o tratamento de erro continuam sendo o codigo real. Trocar o modulo
 * de API por um duplo faria o teste validar o duplo.
 *
 * Toda chamada sem handler falha o teste (`onUnhandledRequest: 'error'`): uma
 * rota esquecida nao passa despercebida.
 */
export const API = 'http://api.test/api/v1'

export const server = setupServer()

/** Liga a API simulada no arquivo de teste que chamar (nao e hook do React, apesar do formato). */
export function mockApi(...handlers: RequestHandler[]): void {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  beforeEach(() => {
    vi.stubEnv('API_BASE_URL', API)
    if (handlers.length > 0) server.use(...handlers)
  })
  afterEach(() => {
    server.resetHandlers()
    server.events.removeAllListeners()
    vi.unstubAllEnvs()
  })
  afterAll(() => server.close())
}

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete'

/** Resposta de sucesso da API. */
export function ok(method: Method, path: string, body: JsonBodyType = null, status = 200): RequestHandler {
  return http[method](`${API}${path}`, () =>
    status === 204 ? new HttpResponse(null, { status }) : HttpResponse.json(body, { status }),
  )
}

/** Recusa no envelope de erro do documento 12.2, com a mensagem em ingles que o usuario nunca deve ver. */
export function fail(
  method: Method,
  path: string,
  status: number,
  code: string,
  fieldErrors: { field: string; message: string }[] = [],
): RequestHandler {
  return http[method](`${API}${path}`, () =>
    HttpResponse.json({ status, code, message: `Technical message for ${code}`, fieldErrors }, { status }),
  )
}

export type Role = 'ADMIN' | 'SUPERVISOR' | 'TECHNICIAN'

/** `GET /auth/me`: quem a API diz que esta logado. */
export function signedInAs(role: Role): RequestHandler {
  return ok('get', '/auth/me', { id: 'u-1', name: `Pessoa ${role}`, email: `${role.toLowerCase()}@fieldops.test`, role })
}

export type RecordedRequest = { readonly method: string; readonly path: string }

/**
 * Guarda metodo e caminho de cada chamada, na hora em que ela sai -- sem
 * esperar nada assincrono, para o teste nunca conferir antes do registro. Para
 * conferir o corpo, use `capture`, que le dentro do proprio handler.
 */
export function recordRequests(): RecordedRequest[] {
  const received: RecordedRequest[] = []
  server.events.on('request:start', ({ request }) => {
    received.push({ method: request.method, path: new URL(request.url).pathname.replace('/api/v1', '') })
  })
  return received
}

/** Responde a chamada e guarda o corpo recebido, lido antes da resposta sair. */
export function capture(method: Method, path: string, response: JsonBodyType = null, status = 200) {
  const bodies: unknown[] = []
  const handler = http[method](`${API}${path}`, async ({ request }) => {
    bodies.push(await request.json().catch(() => null))
    return status === 204 ? new HttpResponse(null, { status }) : HttpResponse.json(response, { status })
  })
  return { handler, bodies }
}
