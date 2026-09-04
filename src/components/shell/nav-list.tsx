'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { IconType } from 'react-icons'
import {
  IoAlertCircleOutline,
  IoBusinessOutline,
  IoClipboardOutline,
  IoConstructOutline,
  IoDocumentTextOutline,
  IoHomeOutline,
  IoLocationOutline,
  IoPeopleOutline,
  IoTimeOutline,
} from 'react-icons/io5'

import { isActive, type NavigationItem } from '@/lib/navigation'

/**
 * Icone por area, na mesma familia e no mesmo estilo do aplicativo de campo
 * (Ionicons outline): tecnico e supervisor usam pontas do mesmo produto, e
 * simbolo diferente para a mesma coisa faz parecerem dois sistemas. Inspecoes e
 * nao conformidades usam literalmente os mesmos simbolos das abas do app.
 *
 * O mapa fica aqui, e nao no modulo de navegacao, porque aquele carrega as
 * regras de perfil e roda no servidor: importar componente de React nele
 * obrigaria a marca-lo como codigo de cliente.
 */
const ICONS: Record<string, IconType> = {
  '/dashboard': IoHomeOutline,
  '/users': IoPeopleOutline,
  '/clients': IoBusinessOutline,
  '/sites': IoLocationOutline,
  '/equipment': IoConstructOutline,
  '/inspection-templates': IoDocumentTextOutline,
  '/inspections': IoClipboardOutline,
  '/non-conformities': IoAlertCircleOutline,
  '/audit': IoTimeOutline,
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
