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
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col gap-6 rounded-card border border-neutral-200 bg-neutral-0 p-8">
        <div className="flex flex-col gap-1">
          <span className="grid size-10 place-items-center rounded-field bg-brand-600 font-bold text-neutral-0">
            FO
          </span>
          <h1 className="mt-2 text-xl font-semibold">FieldOps</h1>
          <p className="text-sm text-neutral-500">Painel administrativo</p>
        </div>

        <div className="flex flex-col gap-3">
          <p className="rounded-field bg-warning-soft px-3 py-2 text-xs text-warning">
            Entrada provisória de desenvolvimento. O acesso com e-mail e senha chega na issue #6.
          </p>

          {ASSIGNABLE_USER_ROLES.map((role) => (
            <form key={role} action={signInForDevelopment}>
              <input type="hidden" name="role" value={role} />
              <button
                type="submit"
                className="w-full rounded-field border border-neutral-200 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
              >
                Entrar como {USER_ROLE_LABELS[role]}
              </button>
            </form>
          ))}
        </div>
      </div>
    </main>
  )
}
