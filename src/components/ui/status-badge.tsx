import type { StatusTone } from '@/lib/domain/page'

const TONES: Record<StatusTone, string> = {
  success: 'bg-success-soft text-success',
  neutral: 'bg-neutral-100 text-neutral-600',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
}

/**
 * Selo de situacao. O rotulo textual e a informacao; a cor e so apoio, porque
 * estado comunicado apenas por cor some para quem nao distingue a cor.
 */
export function StatusBadge({ label, tone }: { label: string; tone: StatusTone }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}
