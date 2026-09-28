/**
 * Corpo padronizado que a API devolve em toda resposta de erro -- o registro
 * `ApiError` do backend: status, codigo legivel por maquina, mensagem, caminho,
 * id de correlacao e erros por campo.
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

/**
 * Falha de uma chamada a API, com o corpo ja lido.
 *
 * `code` e o que a interface usa para escolher a mensagem de negocio; a
 * `message` do backend e em ingles e nunca vai direto para a tela.
 */
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

/**
 * A API nao respondeu: servidor fora do ar, DNS, recusa de conexao. Separada
 * de `ApiError` porque a orientacao para a pessoa e outra -- tentar de novo,
 * e nao corrigir o que digitou.
 */
export class ApiUnavailableError extends Error {
  constructor(cause: unknown) {
    super('API unavailable', { cause })
    this.name = 'ApiUnavailableError'
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return typeof candidate.code === 'string' && typeof candidate.message === 'string'
}

/**
 * Converte uma resposta de erro em `ApiError`. Um corpo fora do contrato --
 * proxy reverso devolvendo HTML, por exemplo -- vira um erro generico com o
 * status real, para que a tela ainda consiga distinguir 401 de 500.
 */
export async function toApiError(response: Response): Promise<ApiError> {
  const body: unknown = await response.json().catch(() => null)

  if (isApiErrorBody(body)) {
    return new ApiError({ ...body, status: response.status })
  }

  return new ApiError({
    status: response.status,
    code: 'UNEXPECTED_RESPONSE',
    message: `Unexpected response with status ${response.status}`,
  })
}
