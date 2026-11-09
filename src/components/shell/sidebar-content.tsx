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
      <div className="flex h-24 shrink-0 items-center gap-4 border-b border-neutral-200 px-5 lg:h-[7.25rem]">
        <BrandMark variant="solid" className="size-10" />
        <span className="flex min-w-0 flex-col gap-0.5 leading-tight">
          <span className="truncate text-2xl font-bold tracking-tight text-brand-700">FieldOps</span>
          <span className="truncate text-sm font-medium text-neutral-800">Gestão de Campo</span>
        </span>
      </div>

      <nav aria-label="Áreas do painel" className="flex-1 overflow-y-auto px-2.5 py-5">
        <NavList items={items} onNavigate={onNavigate} />
      </nav>
    </>
  )
}
