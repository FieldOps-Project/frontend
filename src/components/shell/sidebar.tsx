import { SidebarContent } from '@/components/shell/sidebar-content'
import type { NavigationItem } from '@/lib/navigation'

/**
 * Menu lateral fixo, presente a partir de telas grandes (1024px).
 *
 * Abaixo disso ele nao existe: os 288px do menu tomariam mais de um terco de um
 * tablet em retrato e deixariam o conteudo espremido, entao quem navega e a
 * gaveta (`MobileNav`), com o mesmo conteudo.
 *
 * A lista de itens chega pronta do servidor, ja filtrada por perfil, entao o
 * navegador nunca recebe as areas que aquele perfil nao pode ver.
 */
export function Sidebar({ items }: { items: readonly NavigationItem[] }) {
  return (
    <aside className="hidden w-72 shrink-0 flex-col scrollbar-none overflow-y-auto border-r border-neutral-200 bg-neutral-0 lg:flex">
      <SidebarContent items={items} />
    </aside>
  )
}
