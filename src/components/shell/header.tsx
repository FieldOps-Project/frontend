import { IoLogOutOutline } from 'react-icons/io5'

import { EnvironmentBadge } from '@/components/shell/environment-badge'
import { MobileNav } from '@/components/shell/mobile-nav'
import { signOut } from '@/features/auth/actions'
import { USER_ROLE_LABELS } from '@/lib/domain/user'
import type { NavigationItem } from '@/lib/navigation'
import type { SessionUser } from '@/lib/session'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts.at(0)?.charAt(0) ?? ''
  const last = parts.length > 1 ? (parts.at(-1)?.charAt(0) ?? '') : ''

  return (first + last).toUpperCase()
}

/**
 * Cabecalho do painel: quem esta logado, com qual perfil, em qual ambiente, e
 * como sair.
 *
 * Componente de servidor. O botao de sair e um formulario que chama uma Server
 * Action, entao funciona sem JavaScript no navegador e nao transforma o
 * cabecalho inteiro em codigo de cliente.
 *
 * Em tela estreita nome e perfil dao lugar as iniciais e o rotulo do botao some,
 * ficando so o icone: e a informacao que se pode perder primeiro, porque quem
 * esta logado ja e a propria pessoa.
 */
export function Header({
  user,
  environment,
  items,
}: {
  user: SessionUser
  environment: string | undefined
  items: readonly NavigationItem[]
}) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-neutral-200 bg-neutral-0 px-3 sm:px-6">
      <MobileNav items={items} />

      <div className="flex-1" />

      <EnvironmentBadge environment={environment} />

      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700"
        >
          {initials(user.name)}
        </span>
        <span className="hidden min-w-0 flex-col leading-tight sm:flex">
          <span className="truncate text-sm font-medium">{user.name}</span>
          <span className="truncate text-xs text-neutral-500">{USER_ROLE_LABELS[user.role]}</span>
        </span>
      </div>

      <form action={signOut}>
        <button
          type="submit"
          className="flex items-center gap-2 rounded-field border border-neutral-200 px-2.5 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 sm:px-3"
        >
          <IoLogOutOutline aria-hidden className="size-[18px]" />
          <span className="hidden sm:inline">Sair</span>
          <span className="sr-only sm:hidden">Sair</span>
        </button>
      </form>
    </header>
  )
}
