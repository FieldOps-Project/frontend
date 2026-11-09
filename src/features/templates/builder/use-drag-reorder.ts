'use client'

import { useRef, useState, type DragEvent, type PointerEvent } from 'react'

/** Lista com `dragged` movido para a posicao de `target`. */
export function reordered(ids: readonly string[], dragged: string, target: string): readonly string[] {
  const from = ids.indexOf(dragged)
  const to = ids.indexOf(target)
  if (from < 0 || to < 0 || from === to) return ids
  const next = ids.filter((id) => id !== dragged)
  next.splice(to, 0, dragged)
  return next
}

/**
 * Arrastar para reordenar pelas alcas do desenho do construtor (HTML5 drag and
 * drop, so com mouse). O arraste so comeca pela alca, para nao competir com a
 * selecao de texto; teclado e toque usam os botoes de mover.
 */
export function useDragReorder(ids: readonly string[], onReorder: (order: readonly string[]) => void) {
  const fromHandle = useRef(false)
  const [dragged, setDragged] = useState<string | null>(null)
  const [over, setOver] = useState<string | null>(null)

  function handleProps() {
    return {
      onPointerDown: () => {
        fromHandle.current = true
      },
      onPointerUp: () => {
        fromHandle.current = false
      },
      className: 'cursor-grab active:cursor-grabbing',
    } satisfies { onPointerDown: (event: PointerEvent) => void; onPointerUp: () => void; className: string }
  }

  function itemProps(id: string) {
    return {
      draggable: true,
      onDragStart: (event: DragEvent) => {
        if (!fromHandle.current) {
          event.preventDefault()
          return
        }
        // Itens ficam dentro de secoes arrastaveis: o arraste e so desta lista.
        event.stopPropagation()
        event.dataTransfer.effectAllowed = 'move'
        setDragged(id)
      },
      onDragOver: (event: DragEvent) => {
        if (dragged === null) return
        event.preventDefault()
        event.stopPropagation()
        if (over !== id) setOver(id)
      },
      onDrop: (event: DragEvent) => {
        if (dragged === null) return
        event.preventDefault()
        event.stopPropagation()
        if (dragged !== id) {
          const order = reordered(ids, dragged, id)
          if (order !== ids) onReorder(order)
        }
        setDragged(null)
        setOver(null)
      },
      onDragEnd: () => {
        fromHandle.current = false
        setDragged(null)
        setOver(null)
      },
      'data-drop-target': over === id && dragged !== id ? true : undefined,
    }
  }

  return { handleProps, itemProps, dragging: dragged !== null }
}
