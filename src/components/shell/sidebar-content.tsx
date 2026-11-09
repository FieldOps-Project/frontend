import { NavList } from '@/components/shell/nav-list'
import { BrandMark } from '@/components/ui/brand-mark'
import type { NavigationItem } from '@/lib/navigation'

/**
 * Conteudo do menu: marca e areas do painel. E o mesmo no menu fixo e na gaveta
 * do celular, para que a navegacao nao mude de cara conforme a largura.
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
      <div className="flex h-16 items-center gap-2.5 border-b border-neutral-200 px-4">
        <BrandMark />
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate font-semibold">FieldOps</span>
          <span className="truncate text-xs text-neutral-500">Painel administrativo</span>
        </span>
      </div>

      <nav aria-label="Áreas do painel" className="flex-1 overflow-y-auto p-2">
        <NavList items={items} onNavigate={onNavigate} />
      </nav>
    </>
  )
}
