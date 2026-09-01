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
 * chega filtrado pelo perfil, entao as areas que aquele perfil nao pode ver nem
 * sao enviadas ao navegador -- o que continua sendo comodidade, e nao
 * seguranca: a decisao que vale e da API, e cada Server Action revalida por
 * conta propria (documento 14.13).
 *
 * A altura e travada em uma tela e so o miolo rola: o menu e o cabecalho ficam
 * sempre visiveis, e a barra de rolagem da pagina nunca compete com a da tabela.
 * `min-w-0` em cada nivel e o que impede uma tabela larga de esticar o layout e
 * criar rolagem horizontal na pagina inteira.
 */
export default async function AppLayout({ children }: LayoutProps<'/'>) {
  const user = await getSessionUser()
  const items = navigationFor(user.role)

  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="flex h-dvh overflow-hidden">
          <Sidebar items={items} />

          <div className="flex min-w-0 flex-1 flex-col">
            <Header user={user} environment={process.env.NEXT_PUBLIC_APP_ENV} items={items} />

            <div className="min-w-0 flex-1 overflow-y-auto">
              <Breadcrumbs />
              <main className="mx-auto min-w-0 max-w-7xl px-4 py-6 sm:px-6">{children}</main>
            </div>
          </div>
        </div>
      </ConfirmProvider>
    </ToastProvider>
  )
}
