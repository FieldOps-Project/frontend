import { vi } from 'vitest'

/**
 * Peças do Next que so existem dentro do servidor dele: cookies, cabecalhos e
 * os desvios `redirect` e `notFound`. Sao o framework, nao o acesso a dados --
 * a sessao, a DAL e o cliente HTTP continuam reais.
 *
 * Uso no arquivo de teste (o `vi.mock` precisa ficar no proprio arquivo):
 *
 *   vi.mock('server-only', () => ({}))
 *   vi.mock('next/headers', async () => (await import('@/test/next')).nextHeaders)
 *   vi.mock('next/navigation', async () => (await import('@/test/next')).nextNavigation)
 *   vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
 */
export const cookieJar = new Map<string, string>()

export const nextHeaders = {
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined),
    has: (name: string) => cookieJar.has(name),
    set: (name: string, value: string) => cookieJar.set(name, value),
    delete: (name: string) => cookieJar.delete(name),
  }),
  headers: async () => new Headers({ 'x-fo-pathname': '/dashboard' }),
}

/** O `redirect` do Next interrompe a renderizacao lancando; o teste le o destino. */
export class Redirect extends Error {
  constructor(readonly to: string) {
    super(`redirect to ${to}`)
  }
}

export class NotFound extends Error {
  constructor() {
    super('not found')
  }
}

export const nextNavigation = {
  redirect: (to: string) => {
    throw new Redirect(to)
  },
  notFound: () => {
    throw new NotFound()
  },
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/',
}

/** Sessao valida: o access token esta no cookie. */
export function withSession(): void {
  cookieJar.clear()
  cookieJar.set('fo_at', 'access-token')
  cookieJar.set('fo_rt', 'refresh-token')
}

export function withoutSession(): void {
  cookieJar.clear()
}

/** Roda a acao e devolve o resultado ou o destino do `redirect`. */
export async function outcome<T>(action: () => Promise<T>): Promise<{ result?: T; redirectedTo?: string; notFound?: true }> {
  try {
    return { result: await action() }
  } catch (error) {
    if (error instanceof Redirect) return { redirectedTo: error.to }
    if (error instanceof NotFound) return { notFound: true }
    throw error
  }
}

export function form(values: Record<string, string>): FormData {
  const data = new FormData()
  for (const [name, value] of Object.entries(values)) data.set(name, value)
  return data
}
