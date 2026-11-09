import { NavList } from '@/components/shell/nav-list'
import { SidebarFooter } from '@/components/shell/sidebar-footer'
import { BrandMark } from '@/components/ui/brand-mark'
import type { NavigationItem } from '@/lib/navigation'

/**
 * Conteudo do menu: marca, areas do painel e rodape. E o mesmo no menu fixo e na gaveta
 * do celular, para que a navegacao nao mude de cara conforme a largura.
 *
 * Quem rola e a coluna inteira, nao so a lista: em tela baixa (notebook com
 * zoom), uma lista com rolagem propria entre marca e rodape fixos sobra com
 * tres ou quatro areas visiveis. Com sobra de altura, o rodape desce ao pe.
 */
export function SidebarContent({
  items,
  onNavigate,
}: {
  items: readonly NavigationItem[]
  onNavigate?: () => void
}) {
  return (
    <>
      <div className="flex h-24 shrink-0 items-center gap-4 border-b border-neutral-200 px-5 lg:h-[7.25rem]">
        <BrandMark variant="solid" className="size-10" />
        <span className="flex min-w-0 flex-col gap-0.5 leading-tight">
          <span className="truncate text-2xl font-bold tracking-tight text-brand-700">FieldOps</span>
          <span className="truncate text-sm font-medium text-neutral-800">Gestão de Campo</span>
        </span>
      </div>

      <nav aria-label="Áreas do painel" className="flex-1 px-2.5 py-5">
        <NavList items={items} onNavigate={onNavigate} />
      </nav>

      <SidebarFooter items={items} onNavigate={onNavigate} />
    </>
  )
}
