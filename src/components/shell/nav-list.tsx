'use client'

import {
  Boxes,
  ClipboardList,
  Building2,
  FileText,
  LayoutDashboard,
  MapPin,
  ScrollText,
  TriangleAlert,
  Users,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { isActive, type NavigationItem } from '@/lib/navigation'

/**
 * Icone por area. Fica aqui, e nao no mapa de navegacao, porque o mapa e um
 * modulo de servidor com as regras de perfil: misturar componente de React nele
 * obrigaria a marca-lo como codigo de cliente.
 *
 * O icone acompanha o rotulo, nunca o substitui em tela larga -- icone sozinho
 * e adivinhacao para quem entra no sistema pela primeira vez.
 */
const ICONS: Record<string, LucideIcon> = {
  '/dashboard': LayoutDashboard,
  '/users': Users,
  '/clients': Building2,
  '/sites': MapPin,
  '/equipment': Boxes,
  '/inspection-templates': FileText,
  '/inspections': ClipboardList,
  '/non-conformities': TriangleAlert,
  '/audit': ScrollText,
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
    <ul className="flex flex-col gap-0.5">
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
              className={`group flex items-center gap-3 rounded-field px-3 py-2.5 text-sm transition-colors ${
                collapsed ? 'justify-center' : ''
              } ${
                active
                  ? 'bg-brand-50 font-medium text-brand-700'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              {Icon && (
                <Icon
                  aria-hidden
                  className={`size-[18px] shrink-0 ${active ? 'text-brand-600' : 'text-neutral-400 group-hover:text-neutral-600'}`}
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
