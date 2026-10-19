'use client'

import { useRouter } from 'next/navigation'
import { useTransition, type ReactNode } from 'react'

import { useConfirm } from '@/components/ui/confirm-dialog'
import { BUTTON_DANGER, BUTTON_SECONDARY } from '@/components/ui/styles'
import { useToast } from '@/components/ui/toast'
import type { ActionResult } from '@/lib/form-state'

type ConfirmCopy = {
  readonly title: string
  readonly description: string
  readonly confirmLabel?: string
}

/**
 * Botao de acao critica: pergunta pelo `ConfirmDialog` unico do shell, executa
 * a Server Action e informa o resultado por toast. Fica em processamento ate a
 * resposta chegar, para o segundo clique nao repetir a operacao.
 */
export function ActionButton({
  action,
  confirm,
  tone = 'default',
  children,
  onSuccess,
}: {
  action: () => Promise<ActionResult<unknown>>
  confirm?: ConfirmCopy
  tone?: 'default' | 'danger'
  children: ReactNode
  onSuccess?: (result: ActionResult<unknown>) => void
}) {
  const ask = useConfirm()
  const notify = useToast()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  async function run() {
    if (confirm) {
      const confirmed = await ask({ ...confirm, tone })
      if (!confirmed) return
    }

    startTransition(async () => {
      const result = await action()
      notify(result.message, result.ok ? 'success' : 'error')
      if (result.ok) {
        onSuccess?.(result)
        router.refresh()
      }
    })
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={pending}
      aria-busy={pending}
      className={tone === 'danger' ? BUTTON_DANGER : BUTTON_SECONDARY}
    >
      {pending ? 'Processando…' : children}
    </button>
  )
}
