'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { IconType } from 'react-icons'
import {
  MdAssignmentAdd,
  MdOutlineDashboard,
  MdOutlineDomain,
  MdOutlineFactCheck,
  MdOutlineGroup,
  MdOutlineHandyman,
  MdOutlineLocationOn,
  MdOutlineVerifiedUser,
  MdOutlineWarningAmber,
} from 'react-icons/md'

import { isActive, type NavigationItem } from '@/lib/navigation'

/**
 * Icone por area, da familia Material (contorno) usada no design do painel no
 * Stitch -- a mesma do braco robotico da marca. Um simbolo por area, sempre o
 * mesmo em menu, gaveta e atalhos, para que a pessoa reconheca a area pelo
 * desenho antes de ler o nome.
 *
 * O mapa fica aqui, e nao no modulo de navegacao, porque aquele carrega as
 * regras de perfil e roda no servidor: importar componente de React nele
 * obrigaria a marca-lo como codigo de cliente.
 */
const ICONS: Record<string, IconType> = {
  '/dashboard': MdOutlineDashboard,
  '/users': MdOutlineGroup,
  '/clients': MdOutlineDomain,
  '/sites': MdOutlineLocationOn,
  '/equipment': MdOutlineHandyman,
  '/inspection-templates': MdAssignmentAdd,
  '/inspections': MdOutlineFactCheck,
  '/non-conformities': MdOutlineWarningAmber,
  '/audit': MdOutlineVerifiedUser,
}

export function NavList({
  items,
  collapsed = false,
  onNavigate,
}: {
  items: readonly NavigationItem[]
  collapsed?: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname()

  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => {
        const active = isActive(pathname, item.href)
        const Icon = ICONS[item.href]

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
              className={`group flex items-center gap-4 border-l-[3px] px-5 py-3.5 text-[15px] transition-colors ${
                collapsed ? 'justify-center px-0' : ''
              } ${
                active
                  ? 'rounded-r-md border-brand-700 bg-neutral-100 font-medium text-brand-700'
                  : 'border-transparent text-neutral-800 hover:bg-neutral-50 hover:text-neutral-950'
              }`}
            >
              {Icon && (
                <Icon
                  aria-hidden
                  className={`size-[22px] shrink-0 ${active ? 'text-brand-700' : 'text-neutral-800 group-hover:text-neutral-950'}`}
                />
              )}
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
