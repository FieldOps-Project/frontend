import { IoLogInOutline } from 'react-icons/io5'

import { BrandMark } from '@/components/ui/brand-mark'
import { signInForDevelopment } from '@/features/auth/development-sign-in'
import { ASSIGNABLE_USER_ROLES, USER_ROLE_LABELS } from '@/lib/domain/user'

/**
 * Tela de acesso.
 *
 * O formulario real de e-mail e senha e a issue #6, que depende do JWT da
 * `backend#6`. Ate la esta pagina oferece apenas a entrada de desenvolvimento,
 * para que o shell possa ser aberto e revisado.
 */
export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-neutral-50 p-4 sm:p-6">
      <section className="flex w-full max-w-sm flex-col gap-6 rounded-card border border-neutral-200 bg-neutral-0 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-3">
          <BrandMark className="size-12" />
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-semibold text-neutral-900">FieldOps</h1>
            <p className="text-sm text-neutral-500">Painel administrativo</p>
          </div>
        </div>

        <p className="rounded-field bg-warning-soft px-3 py-2 text-xs leading-relaxed text-warning">
          Entrada provisória de desenvolvimento. O acesso com e-mail e senha chega na issue #6,
          quando a API publicar a autenticação.
        </p>

        <div className="flex flex-col gap-2">
          {ASSIGNABLE_USER_ROLES.map((role) => (
            <form key={role} action={signInForDevelopment}>
              <input type="hidden" name="role" value={role} />
              <button
                type="submit"
                className="flex w-full items-center justify-between gap-3 rounded-field border border-neutral-200 px-3 py-3 text-sm text-neutral-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
              >
                <span>Entrar como {USER_ROLE_LABELS[role]}</span>
                <IoLogInOutline aria-hidden className="size-[18px] shrink-0 text-neutral-400" />
              </button>
            </form>
          ))}
        </div>
      </section>

      <p className="text-xs text-neutral-400">FieldOps · Gestão de inspeções em campo</p>
    </main>
  )
}
