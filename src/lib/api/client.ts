import 'server-only'

import { ApiError, NETWORK_ERROR_CODE, toApiError } from '@/lib/api/errors'

export type QueryValue = string | number | undefined | null

export type ApiRequest = {
  readonly method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  readonly body?: unknown
  readonly query?: Readonly<Record<string, QueryValue>>
  /** Access token. `null` faz a chamada sem `Authorization`, como no login. */
  readonly token: string | null
}

function baseUrl(): string {
  const url = process.env.API_BASE_URL
  if (!url) {
    throw new Error('API_BASE_URL nao configurada.')
  }
  return url.replace(/\/+$/, '')
}

export function buildUrl(path: string, query?: Readonly<Record<string, QueryValue>>): string {
  const url = new URL(`${baseUrl()}${path}`)

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }

  return url.toString()
}

/**
 * Cliente HTTP do servidor do Next para a API Spring.
 *
 * `server-only` faz o build falhar se um Client Component importar este
 * modulo: e isso que impede a URL interna da API e o token de chegarem ao
 * navegador. Dado administrativo e sempre lido fresco (`no-store`), senao a
 * listagem nao reflete o que o tecnico acabou de sincronizar.
 */
export async function apiFetch<T>(path: string, request: ApiRequest): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }

  if (request.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  if (request.token) {
    headers.Authorization = `Bearer ${request.token}`
  }

  let response: Response
  try {
    response = await fetch(buildUrl(path, request.query), {
      method: request.method ?? 'GET',
      headers,
      body: request.body === undefined ? undefined : JSON.stringify(request.body),
      cache: 'no-store',
    })
  } catch {
    throw new ApiError({ status: 0, code: NETWORK_ERROR_CODE, message: 'API unreachable' })
  }

  if (!response.ok) {
    throw await toApiError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
