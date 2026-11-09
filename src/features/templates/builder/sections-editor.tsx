'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { MdArrowDownward, MdArrowUpward } from 'react-icons/md'

import { useToast } from '@/components/ui/toast'
import { reorderSections } from '@/features/templates/builder-actions'
import { SectionCard } from '@/features/templates/builder/section-card'
import { ICON_BUTTON } from '@/features/templates/builder/styles'
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

  function move(index: number, delta: -1 | 1) {
    const order = moved(sections, index, delta).map((section) => section.id)
    startTransition(async () => {
      const result = await reorderSections(templateId, order)
      notify(result.message, result.ok ? 'success' : 'error')
      router.refresh()
    })
  }

  return (
    <>
      {sections.map((section, index) => (
        <SectionCard
          key={section.id}
          templateId={templateId}
          section={section}
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
      ))}
    </>
  )
}
