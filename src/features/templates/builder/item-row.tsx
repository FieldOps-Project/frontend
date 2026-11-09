import { MdDragIndicator } from 'react-icons/md'

import { itemNumber, RESPONSE_TYPE_LABELS, type TemplateItem } from '@/lib/domain/template-builder'

/**
 * Item em modo leitura: numero, pergunta, tipo de resposta e o ponto de
 * obrigatorio (com texto para leitor de tela, nao so a cor). A linha inteira
 * abre a edicao.
 */
export function ItemRow({
  item,
  sectionOrder,
  onEdit,
}: {
  item: TemplateItem
  sectionOrder: number
  onEdit: () => void
}) {
  return (
    <button
      type="button"
      onClick={onEdit}
      aria-label={`Editar o item ${itemNumber(sectionOrder, item.displayOrder)}: ${item.title}`}
      className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-neutral-50 sm:gap-4 sm:px-6 sm:py-5"
    >
      <MdDragIndicator aria-hidden className="size-5 shrink-0 text-neutral-300" />
      <span className="shrink-0 text-[15px] text-neutral-700 tabular-nums">{itemNumber(sectionOrder, item.displayOrder)}</span>
      <span className="min-w-0 flex-1 text-[15px] font-medium break-words text-neutral-950">{item.title}</span>
      <span className="shrink-0 rounded-sm border border-neutral-200 bg-neutral-100 px-2.5 py-1 text-xs font-semibold tracking-wide whitespace-nowrap text-neutral-700 uppercase">
        {RESPONSE_TYPE_LABELS[item.responseType]}
      </span>
      {item.required ? (
        <span title="Obrigatório" className="size-2 shrink-0 rounded-full bg-danger">
          <span className="sr-only">Obrigatório</span>
        </span>
      ) : (
        <span aria-hidden className="size-2 shrink-0" />
      )}
    </button>
  )
}
