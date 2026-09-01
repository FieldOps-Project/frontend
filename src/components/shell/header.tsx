import { EnvironmentBadge } from '@/components/shell/environment-badge'
import { signOut } from '@/features/auth/actions'
import { USER_ROLE_LABELS } from '@/lib/domain/user'
import type { SessionUser } from '@/lib/session'

/**
 * Cabecalho do painel: quem esta logado, com qual perfil, em qual ambiente, e
 * como sair.
 *
 * Componente de servidor. O botao de sair e um formulario que chama uma Server
 * Action, entao funciona sem JavaScript no navegador e nao exige transformar o
 * cabecalho inteiro em componente de cliente.
 */
export function Header({ user, environment }: { user: SessionUser; environment: string | undefined }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-end gap-4 border-b border-neutral-200 bg-neutral-0 px-4">
      <EnvironmentBadge environment={environment} />

      <div className="flex flex-col items-end leading-tight">
        <span className="text-sm font-medium">{user.name}</span>
        <span className="text-xs text-neutral-500">{USER_ROLE_LABELS[user.role]}</span>
      </div>

      <form action={signOut}>
        <button
          type="submit"
          className="rounded-field border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100"
        >
          Sair
        </button>
      </form>
    </header>
  )
}
