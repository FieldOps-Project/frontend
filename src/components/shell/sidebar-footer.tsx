import Link from 'next/link'
import { MdAdd, MdHelpOutline, MdOutlineSettings } from 'react-icons/md'

import type { NavigationItem } from '@/lib/navigation'

const LINKS = [
  { label: 'Configurações', href: '/settings', icon: MdOutlineSettings },
  { label: 'Suporte', href: '/support', icon: MdHelpOutline },
] as const

/**
 * Rodape do menu: atalho para agendar inspecao e as paginas de conta e ajuda.
 *
 * O atalho so aparece para quem enxerga a area de inspecoes -- os mesmos
 * perfis que podem agendar (matriz do documento 5.2) --, entao o menu nunca
 * oferece uma acao que a API recusaria.
 */
export function SidebarFooter({
  items,
  onNavigate,
}: {
  items: readonly NavigationItem[]
  onNavigate?: () => void
}) {
  const canSchedule = items.some((item) => item.href === '/inspections')

  return (
    <div className="flex shrink-0 flex-col gap-3 border-t border-neutral-200 px-5 py-5">
      {canSchedule && (
        <Link
          href="/inspections/new"
          onClick={onNavigate}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-brand-700 px-4 text-[15px] font-medium text-neutral-0 transition-colors hover:bg-brand-800"
        >
          <MdAdd aria-hidden className="size-5" />
          Nova Inspeção
        </Link>
      )}

      <ul className="flex flex-col">
        {LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onNavigate}
              className="flex items-center gap-4 rounded-md px-5 py-2.5 text-[15px] text-neutral-800 transition-colors hover:bg-neutral-50 hover:text-neutral-950"
            >
              <link.icon aria-hidden className="size-[22px] shrink-0" />
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
