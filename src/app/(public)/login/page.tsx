import type { Metadata } from 'next'
import { IoShieldCheckmarkOutline } from 'react-icons/io5'

import { BrandMark } from '@/components/ui/brand-mark'
import { LoginForm } from '@/features/auth/login-form'

export const metadata: Metadata = {
  title: 'Entrar — FieldOps',
}

/**
 * Tela de acesso do painel, a mesma composicao da tela de acesso do aplicativo
 * de campo: marca, titulo, cartao com o formulario e a nota de seguranca.
 *
 * O `redirect` chega do `proxy.ts` com o destino pretendido e segue para o
 * formulario como veio; a Server Action e quem decide se ele e aceitavel.
 */
export default async function LoginPage(props: PageProps<'/login'>) {
  const { redirect } = await props.searchParams
  const redirectTo = typeof redirect === 'string' ? redirect : undefined

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-neutral-50 px-4 py-10">
      <div className="flex w-full max-w-[400px] flex-col gap-8">
        <header className="flex flex-col items-center gap-4 text-center">
          <BrandMark className="size-16" />
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-950">FieldOps</h1>
            <p className="text-sm text-neutral-600">Acesso seguro ao painel administrativo.</p>
          </div>
        </header>

        <section
          aria-label="Entrar no painel"
          className="rounded-card border border-neutral-200 bg-neutral-0 p-6 shadow-sm sm:p-8"
        >
          <LoginForm redirectTo={redirectTo} />
        </section>

        <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-neutral-600">
          <IoShieldCheckmarkOutline aria-hidden className="size-4" />
          Acesso restrito a administradores e supervisores
        </p>
      </div>
    </main>
  )
}
