'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

/**
 * Painel suspenso preso a um botao, como o das notificacoes e o do avatar.
 *
 * Fecha com Esc -- devolvendo o foco ao botao, para quem abriu pelo teclado nao
 * se perder -- e com clique fora. O conteudo recebe `close` para que um link de
 * dentro possa fechar o painel ao navegar.
 */
export function Popover({
  label,
  trigger,
  triggerClassName,
  panelClassName = 'w-72',
  children,
}: {
  label: string
  trigger: ReactNode
  triggerClassName: string
  panelClassName?: string
  children: ReactNode | ((close: () => void) => ReactNode)
}) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        button.current?.focus()
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const close = () => setOpen(false)

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className={triggerClassName}
      >
        {trigger}
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label={label}
          className={`absolute top-full right-0 z-40 mt-2 max-w-[calc(100vw-2rem)] rounded-card border border-neutral-200 bg-neutral-0 shadow-lg ${panelClassName}`}
        >
          {typeof children === 'function' ? children(close) : children}
        </div>
      )}
    </div>
  )
}
