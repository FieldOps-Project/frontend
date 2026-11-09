import { MdDragIndicator } from 'react-icons/md'

import { ItemRow } from '@/features/templates/builder/item-row'
import type { TemplateSection } from '@/lib/domain/template-builder'

/** Secao do checklist: numero, titulo e os itens em ordem. */
export function SectionCard({ section }: { section: TemplateSection }) {
  const headingId = `section-${section.id}`

  return (
    <section aria-labelledby={headingId} className="overflow-hidden rounded-lg border border-neutral-300 bg-neutral-0">
      <header className="flex items-center gap-3 border-b border-neutral-200 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
        <MdDragIndicator aria-hidden className="size-6 shrink-0 text-neutral-500" />
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-brand-50 text-base font-semibold text-brand-700">
          {section.displayOrder}
        </span>
        <h2 id={headingId} className="min-w-0 flex-1 text-lg font-semibold break-words text-neutral-950">
          {section.title}
        </h2>
      </header>

      {section.items.length === 0 ? (
        <p className="px-6 py-6 text-sm text-neutral-500">Nenhum item nesta seção ainda.</p>
      ) : (
        <ol className="divide-y divide-neutral-200">
          {section.items.map((item) => (
            <li key={item.id}>
              <ItemRow item={item} sectionOrder={section.displayOrder} />
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
