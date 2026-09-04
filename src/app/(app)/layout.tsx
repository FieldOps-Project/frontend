import type { ReactNode } from 'react'

/**
 * Shell do grupo de rotas autenticado. O menu lateral, o cabecalho, os
 * breadcrumbs e o dialogo de confirmacao entram na issue #2; aqui fica apenas
 * a moldura que garante que todas as telas nascam dentro do mesmo grupo.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen">{children}</div>
}
