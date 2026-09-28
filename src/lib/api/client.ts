import 'server-only'

import { ApiUnavailableError, toApiError } from '@/lib/api/errors'

type ApiRequest = {
  readonly method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  readonly body?: unknown
  /** Access token da sessao. Ausente nas rotas publicas, como o login. */
  readonly accessToken?: string
}

function apiBaseUrl(): string {
  const value = process.env.API_BASE_URL
  if (!value) {
    throw new Error('API_BASE_URL is not configured')
  }
  return value.replace(/\/+$/, '')
}

/**
 * Cliente HTTP do painel para a API REST.
 *
 * Roda apenas no servidor do Next: `import 'server-only'` faz o build falhar se
 * um Client Component o importar, e e isso que mantem a URL da API e o token
 * fora do navegador. `path` e relativo a `API_BASE_URL`, que ja inclui
 * `/api/v1`.
 *
 * Resposta fora de 2xx vira `ApiError` com o corpo padronizado; falha de rede
 * vira `ApiUnavailableError`. `cache: 'no-store'` porque dado administrativo e
 * sempre fresco.
 */
export async function apiFetch<T>(path: string, request: ApiRequest = {}): Promise<T> {
  const { method = 'GET', body, accessToken } = request

  let response: Response
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    })
  } catch (error) {
    throw new ApiUnavailableError(error)
  }

  if (!response.ok) {
    throw await toApiError(response)
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T)
}
