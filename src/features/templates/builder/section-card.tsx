'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition, type FormEvent, type ReactNode } from 'react'
import { MdAdd, MdArrowDownward, MdArrowUpward, MdDeleteOutline, MdDragIndicator, MdOutlineEdit } from 'react-icons/md'

import { useConfirm } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast'
import { deleteItem, deleteSection, reorderItems, updateSection } from '@/features/templates/builder-actions'
import { ItemEditor } from '@/features/templates/builder/item-editor'
import { ItemRow } from '@/features/templates/builder/item-row'
import { ICON_BUTTON } from '@/features/templates/builder/styles'
import { useDragReorder } from '@/features/templates/builder/use-drag-reorder'
import { validateSection } from '@/features/templates/builder-validation'
import { BUILDER_LIMITS, itemNumber, moved, type TemplateItem, type TemplateSection } from '@/lib/domain/template-builder'

/** Chave do editor de item novo de uma secao. */
function newItemKey(sectionId: string): string {
  return `new:${sectionId}`
}

/**
 * Secao do checklist: numero, titulo, acoes e os itens em ordem.
 *
 * Renomear troca o titulo por um campo no proprio cabecalho. Excluir pede
 * confirmacao dizendo quantos itens vao junto: e a unica acao do construtor
 * que apaga trabalho em lote.
 */
export function SectionCard({
  templateId,
  section,
  actions,
  handleProps,
  editingItemId,
  onEditItem,
  onEditorDone,
}: {
  templateId: string
  section: TemplateSection
  /** Acoes extras do cabecalho, como mover a secao. */
  actions?: ReactNode
  /** Props da alca de arrastar a secao. */
  handleProps?: { onPointerDown: () => void; onPointerUp: () => void; className: string }
  /** Item aberto para edicao, ou `new:<secao>` para item novo; um por vez no construtor inteiro. */
  editingItemId: string | null
  onEditItem: (itemId: string) => void
  onEditorDone: (saved: boolean) => void
}) {
  const [renaming, setRenaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const ask = useConfirm()
  const notify = useToast()
  const router = useRouter()
  const headingId = `section-${section.id}`

  function rename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = String(new FormData(event.currentTarget).get('title') ?? '')
    const found = validateSection({ title })
    if (found.title) {
      setError(found.title)
      return
    }

    startTransition(async () => {
      const result = await updateSection(templateId, section.id, { title, description: section.description })
      if (!result.ok) {
        setError(result.fieldErrors.title ?? result.message)
        return
      }
      notify(result.message, 'success')
      setRenaming(false)
      router.refresh()
    })
  }

  async function remove() {
    const items = section.items.length
    const confirmed = await ask({
      title: `Excluir a seção “${section.title}”?`,
      description:
        items === 0
          ? 'A seção sai do rascunho. As versões já publicadas não mudam.'
          : `A seção e ${items === 1 ? 'o item dela' : `os ${items} itens dela`} saem do rascunho. As versões já publicadas não mudam.`,
      confirmLabel: 'Excluir seção',
      tone: 'danger',
    })
    if (!confirmed) return

    startTransition(async () => {
      const result = await deleteSection(templateId, section.id)
      notify(result.message, result.ok ? 'success' : 'error')
      if (result.ok) router.refresh()
    })
  }

  function saveItemOrder(order: readonly string[]) {
    startTransition(async () => {
      const result = await reorderItems(templateId, section.id, order)
      notify(result.message, result.ok ? 'success' : 'error')
      router.refresh()
    })
  }

  function moveItem(index: number, delta: -1 | 1) {
    saveItemOrder(moved(section.items, index, delta).map((item) => item.id))
  }

  const itemDrag = useDragReorder(
    section.items.map((item) => item.id),
    saveItemOrder,
  )

  async function removeItem(item: TemplateItem) {
    const confirmed = await ask({
      title: `Excluir o item ${itemNumber(section.displayOrder, item.displayOrder)}?`,
      description: `“${item.title}” sai do rascunho e os itens seguintes sobem. As versões já publicadas não mudam.`,
      confirmLabel: 'Excluir item',
      tone: 'danger',
    })
    if (!confirmed) return

    startTransition(async () => {
      const result = await deleteItem(templateId, item.id)
      notify(result.message, result.ok ? 'success' : 'error')
      if (result.ok) router.refresh()
    })
  }

  return (
    <section aria-labelledby={headingId} className="overflow-hidden rounded-lg border border-neutral-300 bg-neutral-0">
      <header className="flex items-center gap-3 border-b border-neutral-200 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
        {handleProps ? (
          <span {...handleProps} title="Arraste para reordenar" className={`flex shrink-0 ${handleProps.className}`}>
            <MdDragIndicator aria-hidden className="size-6 text-neutral-500" />
          </span>
        ) : (
          <MdDragIndicator aria-hidden className="size-6 shrink-0 text-neutral-500" />
        )}
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-brand-50 text-base font-semibold text-brand-700">
          {section.displayOrder}
        </span>

        {renaming ? (
          <form
            onSubmit={rename}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setRenaming(false)
            }}
            noValidate
            className="flex min-w-0 flex-1 flex-col gap-1.5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor={`${headingId}-title`} className="sr-only">
                Título da seção {section.displayOrder}
              </label>
              <input
                id={`${headingId}-title`}
                name="title"
                autoFocus
                defaultValue={section.title}
                maxLength={BUILDER_LIMITS.sectionTitle}
                aria-invalid={error ? true : undefined}
                onChange={() => setError(null)}
                className="h-10 min-w-0 flex-1 rounded-md border border-neutral-300 px-3 text-base font-semibold text-neutral-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 aria-[invalid=true]:border-danger"
              />
              <button type="button" onClick={() => setRenaming(false)} className="px-2 text-sm font-medium text-neutral-700">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex h-10 items-center rounded-md bg-brand-700 px-4 text-sm font-semibold text-neutral-0 hover:bg-brand-800 disabled:opacity-70"
              >
                Salvar
              </button>
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
          </form>
        ) : (
          <>
            <h2 id={headingId} className="min-w-0 flex-1 text-lg font-semibold break-words text-neutral-950">
              {section.title}
            </h2>
            <div className="flex shrink-0 items-center">
              {actions}
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setRenaming(true)
                }}
                aria-label={`Renomear a seção ${section.displayOrder}`}
                title="Renomear"
                className={ICON_BUTTON}
              >
                <MdOutlineEdit aria-hidden className="size-5" />
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={pending}
                aria-label={`Excluir a seção ${section.displayOrder}`}
                title="Excluir"
                className={`${ICON_BUTTON} hover:bg-danger-soft hover:text-danger`}
              >
                <MdDeleteOutline aria-hidden className="size-5" />
              </button>
            </div>
          </>
        )}
      </header>

      {section.items.length === 0 && editingItemId !== newItemKey(section.id) && (
        <p className="px-6 py-6 text-sm text-neutral-500">Nenhum item nesta seção ainda.</p>
      )}

      {section.items.length > 0 && (
        <ol className="divide-y divide-neutral-200">
          {section.items.map((item, index) => (
            <li
              key={item.id}
              {...(editingItemId === null ? itemDrag.itemProps(item.id) : {})}
              className="data-[drop-target]:bg-brand-50 data-[drop-target]:shadow-[inset_0_2px_0_var(--color-brand-600)]"
            >
              {editingItemId === item.id ? (
                <ItemEditor
                  templateId={templateId}
                  sectionId={section.id}
                  number={itemNumber(section.displayOrder, item.displayOrder)}
                  item={item}
                  onDone={onEditorDone}
                />
              ) : (
                <ItemRow
                  item={item}
                  sectionOrder={section.displayOrder}
                  onEdit={() => onEditItem(item.id)}
                  handle={
                    <span {...itemDrag.handleProps()} title="Arraste para reordenar" className={`flex ${itemDrag.handleProps().className}`}>
                      <MdDragIndicator aria-hidden className="size-5 text-neutral-400" />
                    </span>
                  }
                  actions={
                    <>
                      <button
                        type="button"
                        onClick={() => moveItem(index, -1)}
                        disabled={pending || index === 0}
                        aria-label={`Mover o item ${itemNumber(section.displayOrder, item.displayOrder)} para cima`}
                        title="Mover para cima"
                        className={ICON_BUTTON}
                      >
                        <MdArrowUpward aria-hidden className="size-[18px]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(index, 1)}
                        disabled={pending || index === section.items.length - 1}
                        aria-label={`Mover o item ${itemNumber(section.displayOrder, item.displayOrder)} para baixo`}
                        title="Mover para baixo"
                        className={ICON_BUTTON}
                      >
                        <MdArrowDownward aria-hidden className="size-[18px]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeItem(item)}
                        disabled={pending}
                        aria-label={`Excluir o item ${itemNumber(section.displayOrder, item.displayOrder)}`}
                        title="Excluir"
                        className={`${ICON_BUTTON} hover:bg-danger-soft hover:text-danger`}
                      >
                        <MdDeleteOutline aria-hidden className="size-[18px]" />
                      </button>
                    </>
                  }
                />
              )}
            </li>
          ))}
        </ol>
      )}

      {editingItemId === newItemKey(section.id) ? (
        <div className="border-t border-neutral-200">
          <ItemEditor
            templateId={templateId}
            sectionId={section.id}
            number={itemNumber(section.displayOrder, section.items.length + 1)}
            onDone={onEditorDone}
          />
        </div>
      ) : (
        <div className="flex justify-center border-t border-neutral-200 px-4 py-4">
          <button
            type="button"
            onClick={() => onEditItem(newItemKey(section.id))}
            aria-label={`Adicionar item à seção ${section.displayOrder}`}
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-brand-400 px-6 py-2 text-[15px] font-medium text-brand-700 transition-colors hover:bg-brand-50"
          >
            <MdAdd aria-hidden className="size-5" />
            Adicionar Item
          </button>
        </div>
      )}
    </section>
  )
}
