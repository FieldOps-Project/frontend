'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { MdArrowDownward, MdArrowUpward } from 'react-icons/md'

import { useToast } from '@/components/ui/toast'
import { reorderSections } from '@/features/templates/builder-actions'
import { SectionCard } from '@/features/templates/builder/section-card'
import { ICON_BUTTON } from '@/features/templates/builder/styles'
import { useDragReorder } from '@/features/templates/builder/use-drag-reorder'
import { moved, type TemplateSection } from '@/lib/domain/template-builder'

/**
 * Secoes do rascunho em ordem. Mover para cima ou para baixo envia a lista
 * completa na nova ordem numa chamada so (issue #14): os botoes sao o caminho
 * por teclado e toque, como o documento 14.8 autoriza.
 */
export function SectionsEditor({ templateId, sections }: { templateId: string; sections: readonly TemplateSection[] }) {
  const [pending, startTransition] = useTransition()
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const notify = useToast()
  const router = useRouter()

  function editorDone(saved: boolean) {
    setEditingItemId(null)
    if (saved) router.refresh()
  }

  function saveOrder(order: readonly string[]) {
    startTransition(async () => {
      const result = await reorderSections(templateId, order)
      notify(result.message, result.ok ? 'success' : 'error')
      router.refresh()
    })
  }

  function move(index: number, delta: -1 | 1) {
    saveOrder(moved(sections, index, delta).map((section) => section.id))
  }

  const drag = useDragReorder(
    sections.map((section) => section.id),
    saveOrder,
  )

  return (
    <>
      {sections.map((section, index) => (
        <div
          key={section.id}
          {...(editingItemId === null ? drag.itemProps(section.id) : {})}
          className="rounded-lg data-[drop-target]:ring-2 data-[drop-target]:ring-brand-600 data-[drop-target]:ring-offset-2"
        >
          <SectionCard
            templateId={templateId}
            section={section}
            handleProps={editingItemId === null ? drag.handleProps() : undefined}
            editingItemId={editingItemId}
            onEditItem={setEditingItemId}
            onEditorDone={editorDone}
            actions={
              <>
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={pending || index === 0}
                  aria-label={`Mover a seção ${section.displayOrder} para cima`}
                  title="Mover para cima"
                  className={ICON_BUTTON}
                >
                  <MdArrowUpward aria-hidden className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={pending || index === sections.length - 1}
                  aria-label={`Mover a seção ${section.displayOrder} para baixo`}
                  title="Mover para baixo"
                  className={ICON_BUTTON}
                >
                  <MdArrowDownward aria-hidden className="size-5" />
                </button>
              </>
            }
          />
        </div>
      ))}
    </>
  )
}
