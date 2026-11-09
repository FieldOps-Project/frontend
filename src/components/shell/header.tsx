import Link from 'next/link'
import { MdHelpOutline } from 'react-icons/md'

import { HeaderSearch } from '@/components/shell/header-search'
import { EnvironmentLabel } from '@/components/shell/environment-label'
import { MobileNav } from '@/components/shell/mobile-nav'
import { NotificationsButton } from '@/components/shell/notifications-button'
import { RoleBadge } from '@/components/shell/role-badge'
import { UserMenu } from '@/components/shell/user-menu'
import { HEADER_ICON_BUTTON } from '@/components/ui/styles'
import { environmentLabel } from '@/lib/environment'
import type { NavigationItem } from '@/lib/navigation'
import type { SessionUser } from '@/lib/session'

/**
 * Cabecalho do painel, no desenho do Stitch: busca, notificacoes, ajuda,
 * ambiente, perfil e o menu da conta (documento 14.4).
 *
 * Componente de servidor; so as partes que abrem painel sao de cliente.
 *
 * Em tela estreita o que se pode perder primeiro sai antes: ajuda, perfil e o
 * rotulo de producao (que continua no menu do avatar). Ambiente que nao e
 * producao nunca some.
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
    <header className="flex h-[4.5rem] shrink-0 items-center gap-2 border-b border-neutral-200 bg-neutral-0 px-3 sm:gap-3 sm:px-6 lg:px-10">
      <MobileNav items={items} />

      <HeaderSearch />

      <div className="flex-1" />

      <NotificationsButton />

      <Link href="/support" aria-label="Ajuda" title="Ajuda" className={`${HEADER_ICON_BUTTON} hidden sm:grid`}>
        <MdHelpOutline aria-hidden className="size-6" />
      </Link>

      <span aria-hidden className="mx-2 hidden h-8 w-px bg-neutral-200 md:block" />

      <EnvironmentLabel environment={environment} />

      <RoleBadge role={user.role} />

      <UserMenu user={user} environmentLabel={environmentLabel(environment)} />
    </header>
  )
}
