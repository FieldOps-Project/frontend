import type { Metadata } from 'next'
import { IoShieldCheckmarkOutline } from 'react-icons/io5'

import { EnvironmentBadge } from '@/components/shell/environment-badge'
import { BrandMark } from '@/components/ui/brand-mark'
import { INACTIVE_ACCOUNT_MESSAGE } from '@/lib/api/messages'
import { LoginForm } from '@/features/auth/login-form'
import { safeRedirect } from '@/lib/redirect'
import { param } from '@/lib/search-params'

export const metadata: Metadata = {
  title: 'Entrar — FieldOps',
}

type LoginReason = { denied: boolean; inactive: boolean; unavailable: boolean; expired: boolean }

function noticeFor({ denied, inactive, unavailable, expired }: LoginReason): string | undefined {
  if (denied) return 'Seu perfil não tem acesso ao painel administrativo. Técnicos usam o aplicativo de campo.'
  if (inactive) return INACTIVE_ACCOUNT_MESSAGE
  if (unavailable) return 'Não foi possível renovar a sessão porque a API está fora do ar. Tente novamente em instantes.'
  if (expired) return 'Sua sessão expirou. Entre novamente para continuar.'
  return undefined
}

export default async function LoginPage(props: PageProps<'/login'>) {
  const searchParams = await props.searchParams
  const redirectTo = safeRedirect(param(searchParams, 'redirect'))
  const reason: LoginReason = {
    denied: param(searchParams, 'denied') === '1',
    inactive: param(searchParams, 'inactive') === '1',
    unavailable: param(searchParams, 'unavailable') === '1',
    expired: param(searchParams, 'expired') === '1',
  }

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
          className="rounded-card border border-neutral-200 bg-neutral-0 p-6 shadow-raised sm:p-7"
        >
          <LoginForm redirectTo={redirectTo} notice={noticeFor(reason)} />
        </section>

        <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-neutral-600">
          <IoShieldCheckmarkOutline aria-hidden className="size-4" />
          Acesso restrito a administradores e supervisores
        </p>
      </div>
    </main>
  )
}
