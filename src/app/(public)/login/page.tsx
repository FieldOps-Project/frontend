import type { Metadata } from 'next'
import { IoShieldCheckmarkOutline } from 'react-icons/io5'

import { EnvironmentBadge } from '@/components/shell/environment-badge'
import { BrandMark } from '@/components/ui/brand-mark'
import { LoginForm } from '@/features/auth/login-form'
import { safeRedirect } from '@/lib/redirect'
import { param } from '@/lib/search-params'

export const metadata: Metadata = {
  title: 'Entrar — FieldOps',
}

/**
 * Tela de acesso. Unica rota publica do painel: autentica contra a API e a
 * sessao fica em cookie `httpOnly`, gravado pelo servidor do Next.
 *
 * Composicao: marca e titulo, cartao com o formulario e a nota de seguranca.
 * O conjunto cabe numa tela de notebook mesmo com o alerta de erro aberto --
 * rolagem numa tela de tres campos parece pagina quebrada.
 */
export default async function LoginPage(props: PageProps<'/login'>) {
  const searchParams = await props.searchParams
  const redirectTo = safeRedirect(param(searchParams, 'redirect'))
  const expired = param(searchParams, 'expired') === '1'

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-neutral-50 px-4 py-6">
      <div className="flex w-full max-w-[400px] flex-col gap-6">
        <header className="flex flex-col items-center gap-3 text-center">
          <BrandMark className="size-14" />
          <div className="flex flex-col items-center gap-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-950">FieldOps</h1>
            <p className="text-sm text-neutral-600">Acesso seguro ao painel administrativo.</p>
            <EnvironmentBadge environment={process.env.NEXT_PUBLIC_APP_ENV} />
          </div>
        </header>

        <section
          aria-label="Entrar no painel"
          className="rounded-card border border-neutral-200 bg-neutral-0 p-6 shadow-sm sm:p-7"
        >
          <LoginForm
            redirectTo={redirectTo}
            notice={expired ? 'Sua sessão expirou. Entre novamente para continuar.' : undefined}
          />
        </section>

        <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-neutral-600">
          <IoShieldCheckmarkOutline aria-hidden className="size-4" />
          Acesso restrito a administradores e supervisores
        </p>
      </div>
    </main>
  )
}
