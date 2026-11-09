'use client'

import Link from 'next/link'
import { MdLogout, MdOutlinePerson, MdOutlineSettings } from 'react-icons/md'

import { Popover } from '@/components/ui/popover'
import { signOut } from '@/features/auth/actions'
import { USER_ROLE_LABELS } from '@/lib/domain/user'
import type { SessionUser } from '@/lib/session'

const ITEM =
  'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-950'

/**
 * Menu do avatar: quem esta logado, com qual perfil e em qual ambiente, e como
 * sair. O ambiente tambem fica aqui porque em tela estreita ele sai do
 * cabecalho.
 *
 * Sair continua sendo um formulario que chama a Server Action: o refresh token
 * e revogado na API antes de os cookies serem apagados.
 */
export function UserMenu({ user, environmentLabel }: { user: SessionUser; environmentLabel: string }) {
  return (
    <Popover
      label="Menu da conta"
      trigger={<MdOutlinePerson aria-hidden className="size-6" />}
      triggerClassName="grid size-10 place-items-center rounded-full border border-neutral-300 bg-neutral-100 text-neutral-800 transition-colors hover:bg-neutral-200"
      panelClassName="w-72"
    >
      {(close) => (
        <>
          <div className="flex flex-col gap-0.5 border-b border-neutral-200 px-4 py-3">
            <p className="truncate text-sm font-semibold text-neutral-900">{user.name}</p>
            <p className="truncate text-xs text-neutral-500">{user.email}</p>
            <p className="mt-1 text-xs text-neutral-600">
              {USER_ROLE_LABELS[user.role]} · Ambiente: {environmentLabel}
            </p>
          </div>

          <div className="py-1">
            <Link href="/settings" onClick={close} className={ITEM}>
              <MdOutlineSettings aria-hidden className="size-5 text-neutral-500" />
              Configurações
            </Link>
            <form action={signOut}>
              <button type="submit" className={ITEM}>
                <MdLogout aria-hidden className="size-5 text-neutral-500" />
                Sair
              </button>
            </form>
          </div>
        </>
      )}
    </Popover>
  )
}
