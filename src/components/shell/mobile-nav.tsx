'use client'

import { IoCloseOutline, IoMenuOutline } from 'react-icons/io5'
import { useEffect, useState } from 'react'

import { NavList } from '@/components/shell/nav-list'
import { BrandMark } from '@/components/ui/brand-mark'
import type { NavigationItem } from '@/lib/navigation'

/**
 * Gaveta de navegacao para telas estreitas.
 *
 * Abaixo do ponto de corte o menu fixo tomaria metade da largura util, entao a
 * navegacao vira sobreposicao acionada por botao. A gaveta fecha ao escolher um
 * item -- em celular, continuar aberta esconde justamente a tela que a pessoa
 * pediu -- e ao apertar Esc, porque quem abriu com teclado precisa conseguir
 * sair sem mouse.
 *
 * Enquanto aberta, a rolagem do corpo e travada: rolar o conteudo por baixo da
 * sobreposicao faz a pessoa perder o lugar onde estava.
 */
export function MobileNav({ items }: { items: readonly NavigationItem[] }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        aria-expanded={open}
        className="grid size-10 place-items-center rounded-field text-neutral-600 hover:bg-neutral-100"
      >
        <IoMenuOutline aria-hidden className="size-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div
            role="presentation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-neutral-900/50"
          />

          <div className="relative flex h-full w-72 max-w-[85%] flex-col border-r border-neutral-200 bg-neutral-0">
            <div className="flex h-16 items-center justify-between border-b border-neutral-200 px-4">
              <span className="flex items-center gap-2.5">
                <BrandMark />
                <span className="font-semibold">FieldOps</span>
              </span>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="grid size-10 place-items-center rounded-field text-neutral-500 hover:bg-neutral-100"
              >
                <IoCloseOutline aria-hidden className="size-5" />
              </button>
            </div>

            <nav aria-label="Áreas do painel" className="flex-1 overflow-y-auto p-2">
              <NavList items={items} onNavigate={() => setOpen(false)} />
            </nav>
          </div>
        </div>
      )}
    </div>
  )
}
