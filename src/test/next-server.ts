/**
 * O que o Next oferece a Server Components e Server Actions, para os testes de
 * fluxo rodarem fora do servidor: cookies da sessao, cabecalhos e os desvios
 * de navegacao. `redirect` e `notFound` interrompem a execucao como no Next,
 * lancando um sinal que o teste inspeciona.
 */
export class NavigationSignal extends Error {
  constructor(
    readonly kind: 'redirect' | 'notFound',
    readonly target: string | null,
  ) {
    super(kind === 'redirect' ? `redirect to ${target}` : 'not found')
  }
}

const jar = new Map<string, string>()

export function setCookie(name: string, value: string): void {
  jar.set(name, value)
}

export function clearCookies(): void {
  jar.clear()
}

export const cookiesStore = {
  get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) as string } : undefined),
  has: (name: string) => jar.has(name),
  set: (name: string, value: string) => {
    jar.set(name, value)
  },
  delete: (name: string) => {
    jar.delete(name)
  },
}

export const navigation = {
  redirect: (target: string): never => {
    throw new NavigationSignal('redirect', target)
  },
  notFound: (): never => {
    throw new NavigationSignal('notFound', null)
  },
}

/** Resultado de uma chamada que pode desviar a navegacao, para afirmar sem try/catch no teste. */
export async function outcome<T>(run: () => Promise<T>): Promise<{ value?: T; redirect?: string | null; notFound?: true }> {
  try {
    return { value: await run() }
  } catch (error) {
    if (error instanceof NavigationSignal) {
      return error.kind === 'redirect' ? { redirect: error.target } : { notFound: true }
    }
    throw error
  }
}
