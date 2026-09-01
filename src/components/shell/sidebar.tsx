'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { isActive, type NavigationItem } from '@/lib/navigation'

/**
 * Menu lateral do painel.
 *
 * Componente de cliente por causa de duas coisas que so existem no navegador:
 * a rota atual, para destacar onde a pessoa esta, e o estado de recolhido. A
 * lista de itens chega pronta do servidor, ja filtrada por perfil -- assim o
 * navegador nunca recebe os itens que aquele perfil nao pode ver.
 */
export function Sidebar({ items }: { items: readonly NavigationItem[] }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <nav
      aria-label="Áreas do painel"
      data-collapsed={collapsed}
      className="flex h-full w-60 shrink-0 flex-col border-r border-neutral-200 bg-neutral-0 transition-[width] data-[collapsed=true]:w-16"
    >
      <div className="flex h-14 items-center gap-2 border-b border-neutral-200 px-4">
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-field bg-brand-600 text-sm font-bold text-neutral-0"
        >
          FO
        </span>
        {!collapsed && <span className="truncate font-semibold">FieldOps</span>}
      </div>

      <ul className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {items.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
                className={`block truncate rounded-field px-3 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-brand-50 font-medium text-brand-700'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {collapsed ? item.label.slice(0, 1) : item.label}
              </Link>
            </li>
          )
        })}
      </ul>

      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        aria-expanded={!collapsed}
        className="m-2 rounded-field border border-neutral-200 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100"
      >
        {collapsed ? '»' : '« Recolher menu'}
      </button>
    </nav>
  )
}
