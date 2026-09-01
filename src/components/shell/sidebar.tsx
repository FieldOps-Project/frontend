'use client'

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useState } from 'react'

import { NavList } from '@/components/shell/nav-list'
import type { NavigationItem } from '@/lib/navigation'

/**
 * Menu lateral fixo, presente a partir de telas medias.
 *
 * Em largura pequena ele nao existe: ocupar 240px de uma tela de 360px deixaria
 * o conteudo espremido, entao abaixo do ponto de corte quem navega e a gaveta
 * (`MobileNav`). Recolher continua disponivel em telas medias, onde 240px ainda
 * pesam.
 *
 * A lista de itens chega pronta do servidor, ja filtrada por perfil, entao o
 * navegador nunca recebe as areas que aquele perfil nao pode ver.
 */
export function Sidebar({ items }: { items: readonly NavigationItem[] }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`hidden shrink-0 flex-col border-r border-neutral-200 bg-neutral-0 transition-[width] duration-200 md:flex ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div
        className={`flex h-16 items-center gap-2.5 border-b border-neutral-200 px-4 ${
          collapsed ? 'justify-center px-0' : ''
        }`}
      >
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-field bg-brand-600 text-sm font-bold text-neutral-0"
        >
          FO
        </span>
        {!collapsed && (
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-semibold">FieldOps</span>
            <span className="truncate text-xs text-neutral-500">Painel administrativo</span>
          </span>
        )}
      </div>

      <nav aria-label="Áreas do painel" className="flex-1 overflow-y-auto p-2">
        <NavList items={items} collapsed={collapsed} />
      </nav>

      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        className={`m-2 flex items-center gap-3 rounded-field px-3 py-2.5 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 ${
          collapsed ? 'justify-center' : ''
        }`}
      >
        {collapsed ? (
          <PanelLeftOpen aria-hidden className="size-[18px] shrink-0" />
        ) : (
          <PanelLeftClose aria-hidden className="size-[18px] shrink-0" />
        )}
        {!collapsed && <span>Recolher menu</span>}
      </button>
    </aside>
  )
}
