import { Breadcrumbs } from '@/components/shell/breadcrumbs'
import { Header } from '@/components/shell/header'
import { Sidebar } from '@/components/shell/sidebar'
import { ConfirmProvider } from '@/components/ui/confirm-dialog'
import { ToastProvider } from '@/components/ui/toast'
import { navigationFor } from '@/lib/navigation'
import { getSessionUser } from '@/lib/session'

/**
 * Shell do grupo de rotas autenticado (documento 14.4 e issue #2).
 *
 * Componente de servidor: a sessao e lida aqui e desce como dado. O menu ja
 * chega filtrado pelo perfil, entao os itens que aquele perfil nao pode ver nem
 * sao enviados ao navegador -- o que continua sendo comodidade, e nao
 * seguranca: a decisao que vale e da API, e cada Server Action revalida por
 * conta propria (documento 14.13).
 *
 * O miolo rola sozinho, sem levar o menu junto, e a largura minima util e
 * 1366x768 sem rolagem horizontal, como exige o criterio da issue.
 */
export default async function AppLayout({ children }: LayoutProps<'/'>) {
  const user = await getSessionUser()

  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar items={navigationFor(user.role)} />

          <div className="flex min-w-0 flex-1 flex-col">
            <Header user={user} environment={process.env.NEXT_PUBLIC_APP_ENV} />
            <Breadcrumbs />
            <main className="min-w-0 flex-1 overflow-y-auto px-6 pb-8">{children}</main>
          </div>
        </div>
      </ConfirmProvider>
    </ToastProvider>
  )
}
