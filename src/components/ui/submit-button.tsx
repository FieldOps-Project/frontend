'use client'

import type { ReactNode } from 'react'
import { useFormStatus } from 'react-dom'

/**
 * Botao de envio que acompanha o formulario em que esta.
 *
 * Enquanto a Server Action roda ele fica desabilitado, com indicador de
 * progresso e o rotulo de processamento -- o documento 14.15 pede que a acao em
 * andamento evite envio duplicado. `aria-busy` informa o estado a leitores de
 * tela, que nao veem o giro do indicador.
 */
export function SubmitButton({
  children,
  pendingLabel,
}: {
  children: ReactNode
  pendingLabel: string
}) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-field bg-brand-600 px-4 text-sm font-semibold text-neutral-0 transition-colors hover:bg-brand-700 active:bg-brand-800 disabled:cursor-wait disabled:bg-brand-400"
    >
      {pending ? (
        <>
          <span
            aria-hidden
            className="size-4 animate-spin rounded-full border-2 border-neutral-0/40 border-t-neutral-0"
          />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  )
}
