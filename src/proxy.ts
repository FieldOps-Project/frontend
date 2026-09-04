import { NextResponse, type NextRequest } from 'next/server'

/** Cookie que guarda o access token. Definido pelo login na issue #6. */
const SESSION_COOKIE = 'fo_at'

/**
 * Guarda de rota do painel.
 *
 * Em Next.js 16 este arquivo substitui o `middleware.ts` e exporta `proxy`.
 * A checagem aqui e deliberadamente barata: ela so olha se existe cookie de
 * sessao, para evitar renderizar uma pagina inteira que terminaria em
 * redirecionamento. Nao e a barreira de autorizacao -- essa vive na camada de
 * acesso a dados, que e reexecutada por Server Actions e Route Handlers, cada
 * um deles um ponto de entrada independente e invocavel diretamente.
 *
 * O destino pretendido viaja em `redirect` para que o login devolva a pessoa
 * ao lugar de onde ela veio.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSession = request.cookies.has(SESSION_COOKIE)

  if (!hasSession && !pathname.startsWith('/login')) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
