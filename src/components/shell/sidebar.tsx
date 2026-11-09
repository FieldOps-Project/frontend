import { BrandMark } from '@/components/ui/brand-mark'
import { NavList } from '@/components/shell/nav-list'
import type { NavigationItem } from '@/lib/navigation'

/**
 * Menu lateral fixo, presente a partir de telas medias.
 *
 * Em largura pequena ele nao existe: ocupar 240px de uma tela de 360px deixaria
 * o conteudo espremido, entao abaixo do ponto de corte quem navega e a gaveta
 * (`MobileNav`).
 *
 * A lista de itens chega pronta do servidor, ja filtrada por perfil, entao o
 * navegador nunca recebe as areas que aquele perfil nao pode ver.
 */
export function Sidebar({ items }: { items: readonly NavigationItem[] }) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-neutral-200 bg-neutral-0 md:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-neutral-200 px-4">
        <BrandMark />
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate font-semibold">FieldOps</span>
          <span className="truncate text-xs text-neutral-500">Painel administrativo</span>
        </span>
      </div>

      <nav aria-label="Áreas do painel" className="flex-1 overflow-y-auto p-2">
        <NavList items={items} />
      </nav>
    </aside>
  )
}
