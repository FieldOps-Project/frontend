import type { ReactNode } from 'react'

const TONES = {
  success: 'border-success/30 bg-success-soft text-success',
  info: 'border-info/30 bg-info-soft text-info',
  warning: 'border-warning/30 bg-warning-soft text-warning',
  danger: 'border-danger/30 bg-danger-soft text-danger',
} as const

export function Notice({ tone = 'info', children }: { tone?: keyof typeof TONES; children: ReactNode }) {
  return (
    <p role={tone === 'danger' ? 'alert' : 'status'} className={`rounded-card border px-4 py-3 text-sm ${TONES[tone]}`}>
      {children}
    </p>
  )
}

/**
 * Confirmacao depois de criar ou salvar. A action redireciona para a lista com
 * `?notice=`, e a mensagem chega renderizada no servidor, sem depender de
 * JavaScript no navegador.
 */
const NOTICES: Record<string, string> = {
  created: 'Registro criado com sucesso.',
  updated: 'Alterações salvas.',
  scheduled: 'Inspeção agendada e atribuída ao técnico.',
}

export function FlashNotice({ code }: { code: string | undefined }) {
  const message = code ? NOTICES[code] : undefined
  return message ? <Notice tone="success">{message}</Notice> : null
}
