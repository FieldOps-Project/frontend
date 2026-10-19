/**
 * Envelope de erro fixo da API (documento 12.2). Vale para todas as telas: e o
 * `fieldErrors` que permite levar a mensagem ao campo certo em vez de um alerta
 * generico no topo do formulario.
 */
export type ApiFieldError = {
  readonly field: string
  readonly message: string
}

export type ApiErrorBody = {
  readonly timestamp?: string
  readonly status: number
  readonly code: string
  readonly message: string
  readonly path?: string
  readonly requestId?: string
  readonly fieldErrors?: readonly ApiFieldError[]
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fieldErrors: readonly ApiFieldError[]
  readonly requestId: string | undefined

  constructor(body: ApiErrorBody) {
    super(body.message)
    this.name = 'ApiError'
    this.status = body.status
    this.code = body.code
    this.fieldErrors = body.fieldErrors ?? []
    this.requestId = body.requestId
  }
}

/** Falha antes de existir resposta: API fora do ar, DNS, conexao recusada. */
export const NETWORK_ERROR_CODE = 'NETWORK_ERROR'

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

function isErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ApiErrorBody).code === 'string' &&
    typeof (value as ApiErrorBody).message === 'string'
  )
}

/**
 * Le o corpo padronizado. Resposta sem o envelope -- proxy reverso, pagina de
 * erro do servidor -- vira um erro sintetico com o status recebido, para que a
 * tela sempre tenha `code` e `status` com que decidir.
 */
export async function toApiError(response: Response): Promise<ApiError> {
  const body: unknown = await response.json().catch(() => null)

  if (isErrorBody(body)) {
    return new ApiError({ ...body, status: body.status ?? response.status })
  }

  return new ApiError({
    status: response.status,
    code: response.status >= 500 ? 'INTERNAL_ERROR' : 'UNEXPECTED_RESPONSE',
    message: response.statusText || 'Unexpected response',
  })
}
