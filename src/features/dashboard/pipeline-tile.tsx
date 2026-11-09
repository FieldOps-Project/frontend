import Link from 'next/link'

import { INSPECTION_STATUS_LABELS, type InspectionStatus } from '@/lib/domain/inspection'

/** Cores de cada estado, as do desenho do painel no Stitch. */
const TONES: Record<InspectionStatus, { readonly box: string; readonly text: string }> = {
  DRAFT: { box: 'border-neutral-300 bg-neutral-0 hover:bg-neutral-50', text: 'text-neutral-950' },
  ASSIGNED: { box: 'border-neutral-300 bg-neutral-0 hover:bg-neutral-50', text: 'text-neutral-950' },
  IN_PROGRESS: { box: 'border-brand-200 bg-brand-50 hover:bg-brand-100/70', text: 'text-brand-700' },
  SUBMITTED: { box: 'border-neutral-300 bg-neutral-0 hover:bg-neutral-50', text: 'text-neutral-950' },
  UNDER_REVIEW: { box: 'border-tertiary-300 bg-tertiary-100/70 hover:bg-tertiary-100', text: 'text-tertiary-700' },
  APPROVED: { box: 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100', text: 'text-secondary-500' },
  REJECTED: { box: 'border-danger-soft bg-danger-soft/40 hover:bg-danger-soft/70', text: 'text-danger' },
  CANCELED: { box: 'border-neutral-200 bg-neutral-200 hover:bg-neutral-300/70', text: 'text-neutral-500' },
}

const NUMBER = new Intl.NumberFormat('pt-BR')

/**
 * Total de um estado. E link para a listagem filtrada por esse estado, para
 * que o numero e a lista nunca divirjam (issue #28).
 */
export function PipelineTile({ status, count }: { status: InspectionStatus; count: number }) {
  const tone = TONES[status]
  const label = INSPECTION_STATUS_LABELS[status]

  return (
    <Link
      href={`/inspections?status=${status}`}
      aria-label={`${label}: ${NUMBER.format(count)} ${count === 1 ? 'inspeção' : 'inspeções'}`}
      className={`flex h-full min-h-[5.75rem] flex-col justify-between gap-2 rounded-md border px-4 py-3.5 transition-colors ${tone.box}`}
    >
      <span className={`text-[13px] leading-snug font-medium tracking-wide uppercase ${tone.text}`}>{label}</span>
      <span className={`text-[26px] leading-none font-semibold tabular-nums ${tone.text}`}>{NUMBER.format(count)}</span>
    </Link>
  )
}
