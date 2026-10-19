import { EnvironmentBadge } from '@/components/shell/environment-badge'
import { BrandMark } from '@/components/ui/brand-mark'
import { LoginForm } from '@/features/auth/login-form'
import { safeRedirect } from '@/lib/redirect'
import { param } from '@/lib/search-params'

/**
 * Tela de acesso. Unica rota publica do painel: autentica contra a API e a
 * sessao fica em cookie `httpOnly`, gravado pelo servidor do Next.
 */
export default async function LoginPage(props: PageProps<'/login'>) {
  const searchParams = await props.searchParams
  const redirectTo = safeRedirect(param(searchParams, 'redirect'))
  const expired = param(searchParams, 'expired') === '1'

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-neutral-50 p-4 sm:p-6">
      <section className="flex w-full max-w-sm flex-col gap-6 rounded-card border border-neutral-200 bg-neutral-0 p-6 shadow-sm sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-3">
            <BrandMark className="size-12" />
            <div className="flex flex-col gap-0.5">
              <h1 className="text-xl font-semibold text-neutral-900">FieldOps</h1>
              <p className="text-sm text-neutral-500">Painel administrativo</p>
            </div>
          </div>
          <EnvironmentBadge environment={process.env.NEXT_PUBLIC_APP_ENV} />
        </div>

        <LoginForm
          redirectTo={redirectTo}
          notice={expired ? 'Sua sessão expirou. Entre novamente para continuar.' : undefined}
        />
      </section>

      <p className="text-xs text-neutral-400">FieldOps · Gestão de inspeções em campo</p>
    </main>
  )
}
