'use client'

import { createContext, use, useCallback, useState, type ReactNode } from 'react'

type ToastTone = 'success' | 'error' | 'info'

type Toast = {
  readonly id: number
  readonly message: string
  readonly tone: ToastTone
}

const ToastContext = createContext<((message: string, tone?: ToastTone) => void) | null>(null)

const TONE_CLASSES: Record<ToastTone, string> = {
  success: 'border-success bg-success-soft text-success',
  error: 'border-danger bg-danger-soft text-danger',
  info: 'border-info bg-info-soft text-info',
}

/**
 * Area de mensagens globais do documento 14.4.
 *
 * A regiao e `aria-live="polite"`: quem usa leitor de tela ouve o resultado da
 * acao sem ter o foco arrancado do lugar onde estava. Mensagem de sucesso que
 * so aparece visualmente deixa a operacao sem retorno para essa pessoa.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<readonly Toast[]>([])

  const notify = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = Date.now() + Math.random()

    setToasts((current) => [...current, { id, message, tone }])
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 6000)
  }, [])

  return (
    <ToastContext value={notify}>
      {children}

      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-4 flex w-80 flex-col gap-2"
      >
        {toasts.map((toast) => (
          <p
            key={toast.id}
            className={`pointer-events-auto rounded-card border px-4 py-3 text-sm shadow-sm ${TONE_CLASSES[toast.tone]}`}
          >
            {toast.message}
          </p>
        ))}
      </div>
    </ToastContext>
  )
}

export function useToast() {
  const notify = use(ToastContext)

  if (!notify) {
    throw new Error('useToast precisa estar dentro de ToastProvider.')
  }

  return notify
}
