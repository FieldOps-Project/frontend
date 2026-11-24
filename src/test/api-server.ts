import { http, HttpResponse, type JsonBodyType } from 'msw'
import { setupServer } from 'msw/node'

/**
 * API simulada no nivel de rede (issue #25).
 *
 * Os testes de fluxo usam o codigo real de acesso a dados -- `apiFetch`, a
 * camada `dal` e a sessao --, e so a resposta HTTP e falsa. Substituir o modulo
 * da API por um duplo testaria o duplo; interceptar a rede testa o painel.
 */
export const API_BASE_URL = 'http://api.test/api/v1'

export function api(path: string): string {
  return `${API_BASE_URL}${path}`
}

export const ADMIN = { id: 'a0000000-0000-4000-8000-000000000001', name: 'Ana Admin', email: 'ana@fieldops.dev', role: 'ADMIN' }
export const SUPERVISOR = { id: 'a0000000-0000-4000-8000-000000000002', name: 'Sérgio Supervisor', email: 'sergio@fieldops.dev', role: 'SUPERVISOR' }
export const TECHNICIAN = { id: 'a0000000-0000-4000-8000-000000000003', name: 'Tiago Técnico', email: 'tiago@fieldops.dev', role: 'TECHNICIAN' }

/** Quem a API reconhece pelo token em `GET /auth/me`. */
export function signedInAs(user: typeof ADMIN) {
  return http.get(api('/auth/me'), () => HttpResponse.json(user))
}

/** Envelope de erro do documento 12.2, como a API Spring responde. */
export function apiError(
  status: number,
  code: string,
  fieldErrors: readonly { field: string; message: string }[] = [],
): HttpResponse<JsonBodyType> {
  return HttpResponse.json(
    { timestamp: '2026-11-24T12:00:00Z', status, code, message: `${code} (mensagem tecnica)`, fieldErrors },
    { status },
  )
}

/** Requisicoes recebidas, para conferir metodo, caminho e corpo enviados. */
export type Received = { readonly method: string; readonly path: string; readonly body: unknown; readonly authorization: string | null }

export const server = setupServer()

export function recordRequests(): Received[] {
  const received: Received[] = []
  server.events.on('request:start', async ({ request }) => {
    const body = request.method === 'GET' ? null : await request.clone().json().catch(() => null)
    received.push({
      method: request.method,
      path: new URL(request.url).pathname.replace('/api/v1', ''),
      body,
      authorization: request.headers.get('Authorization'),
    })
  })
  return received
}
