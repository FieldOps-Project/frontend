'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useFormStatus } from 'react-dom'

import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '@/components/ui/styles'
import type { FormState } from '@/lib/form-state'

/**
 * Botao de envio que desabilita durante a acao. Duplo clique em "Salvar" nao
 * pode criar dois registros. `className` troca a aparencia padrao, como no
 * botao de largura total da tela de acesso.
 */
export function SubmitButton({
  children,
  pendingLabel = 'Salvando…',
  className = BUTTON_PRIMARY,
}: {
  children: ReactNode
  pendingLabel?: string
  className?: string
}) {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending} aria-disabled={pending} aria-busy={pending} className={className}>
      {pending ? (
        <>
          <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-current/40 border-t-current" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  )
}

export function FormFooter({ submitLabel, cancelHref }: { submitLabel: string; cancelHref: string }) {
  return (
    <div className="flex flex-wrap justify-end gap-2 border-t border-neutral-200 pt-4">
      <Link href={cancelHref} className={BUTTON_SECONDARY}>
        Cancelar
      </Link>
      <SubmitButton>{submitLabel}</SubmitButton>
    </div>
  )
}

/** Mensagem geral do formulario, acima dos campos. Os erros de campo ficam em cada campo. */
export function FormAlert({ state }: { state: FormState }) {
  if (state.status !== 'error') {
    return null
  }

  return (
    <p role="alert" className="rounded-field border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
      {state.message}
    </p>
  )
}
