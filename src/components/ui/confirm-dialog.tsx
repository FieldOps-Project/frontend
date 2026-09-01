'use client'

import { createContext, use, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

type ConfirmRequest = {
  readonly title: string
  readonly description: string
  readonly confirmLabel?: string
  readonly cancelLabel?: string
  /** `danger` para acao destrutiva ou irreversivel. */
  readonly tone?: 'default' | 'danger'
}

type PendingRequest = ConfirmRequest & { readonly resolve: (confirmed: boolean) => void }

const ConfirmContext = createContext<((request: ConfirmRequest) => Promise<boolean>) | null>(null)

/**
 * Confirmacao unica do painel, exigida pelo documento 14.4 e pela issue #2.
 *
 * E um dialogo so, no topo da arvore, em vez de um por tela: assim toda acao
 * critica pergunta do mesmo jeito, e a mensagem especifica -- o que exatamente
 * vai acontecer -- fica com quem chama. O `<dialog>` nativo cuida do foco preso
 * dentro da caixa e do fechamento por Esc, que seriam trabalhosos de refazer a
 * mao e faceis de fazer errado.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingRequest | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (pending && !dialog.open) {
      dialog.showModal()
    }
    if (!pending && dialog.open) {
      dialog.close()
    }
  }, [pending])

  const confirm = useCallback(
    (request: ConfirmRequest) =>
      new Promise<boolean>((resolve) => {
        setPending({ ...request, resolve })
      }),
    [],
  )

  const settle = useCallback(
    (confirmed: boolean) => {
      pending?.resolve(confirmed)
      setPending(null)
    },
    [pending],
  )

  return (
    <ConfirmContext value={confirm}>
      {children}

      <dialog
        ref={dialogRef}
        aria-labelledby="confirm-title"
        onCancel={(event) => {
          event.preventDefault()
          settle(false)
        }}
        className="max-w-md rounded-card border border-neutral-200 p-0 backdrop:bg-neutral-900/40"
      >
        {pending && (
          <div className="flex flex-col gap-4 p-6">
            <h2 id="confirm-title" className="text-lg font-semibold">
              {pending.title}
            </h2>
            <p className="text-sm text-neutral-600">{pending.description}</p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => settle(false)}
                className="rounded-field border border-neutral-200 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100"
              >
                {pending.cancelLabel ?? 'Cancelar'}
              </button>
              <button
                type="button"
                onClick={() => settle(true)}
                className={`rounded-field px-3 py-2 text-sm font-medium text-neutral-0 ${
                  pending.tone === 'danger'
                    ? 'bg-danger hover:opacity-90'
                    : 'bg-brand-600 hover:bg-brand-700'
                }`}
              >
                {pending.confirmLabel ?? 'Confirmar'}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </ConfirmContext>
  )
}

export function useConfirm() {
  const confirm = use(ConfirmContext)

  if (!confirm) {
    throw new Error('useConfirm precisa estar dentro de ConfirmProvider.')
  }

  return confirm
}
