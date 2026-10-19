import { NextResponse, type NextRequest } from 'next/server'

import {
  ACCESS_TOKEN_COOKIE,
  PATHNAME_HEADER,
  REFRESH_TOKEN_COOKIE,
  refreshPath,
} from '@/lib/session-cookies'

/** Rotas que nao exigem sessao: o login e o fluxo de renovacao. */
function isPublic(pathname: string): boolean {
  return pathname.startsWith('/login') || pathname.startsWith('/api/auth/')
}

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
 * O cookie do access token expira junto com o token. Quem so tem o refresh
 * token passa pela renovacao antes de chegar a pagina; quem nao tem nenhum vai
 * ao login. Nos dois casos o destino pretendido viaja em `redirect`.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (isPublic(pathname)) {
    return NextResponse.next()
  }

  const destination = `${pathname}${search}`

  if (!request.cookies.has(ACCESS_TOKEN_COOKIE)) {
    if (request.cookies.has(REFRESH_TOKEN_COOKIE)) {
      return NextResponse.redirect(new URL(refreshPath(destination), request.url))
    }

    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', destination)
    return NextResponse.redirect(url)
  }

  const headers = new Headers(request.headers)
  headers.set(PATHNAME_HEADER, destination)

  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
