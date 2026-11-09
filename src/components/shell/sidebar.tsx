import { SidebarContent } from '@/components/shell/sidebar-content'
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
      <SidebarContent items={items} />
    </aside>
  )
}
