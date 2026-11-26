import Link from 'next/link'
import type { ReactNode } from 'react'
import { MdErrorOutline } from 'react-icons/md'

import { SeverityBadge } from '@/features/dashboard/severity-badge'
import { DASHBOARD_CARD } from '@/features/dashboard/styles'
import { nonConformityTotal } from '@/lib/domain/dashboard'
import { SEVERITIES, SEVERITY_LABELS, type Severity } from '@/lib/domain/inspection-review'

const NUMBER = new Intl.NumberFormat('pt-BR')

const TILE = 'flex h-full min-h-[5.75rem] flex-col justify-between gap-3 rounded-md border border-neutral-300 bg-neutral-0 px-4 py-3.5'

type Props = {
  readonly counts: Readonly<Record<Severity, number>>
  readonly linkable: boolean
}

function Tile({ severity, count, linkable }: { severity: Severity; count: number; linkable: boolean }) {
  const content: ReactNode = (
    <>
      <SeverityBadge severity={severity} />
      <span className="text-[26px] leading-none font-semibold tabular-nums text-neutral-950">{NUMBER.format(count)}</span>
    </>
  )

  if (!linkable) {
    return <div className={TILE}>{content}</div>
  }

  return (
    <Link
      href={`/non-conformities?severity=${severity}`}
      aria-label={`${SEVERITY_LABELS[severity]}: ${NUMBER.format(count)} ${count === 1 ? 'não conformidade' : 'não conformidades'}`}
      className={`${TILE} transition-colors hover:bg-surface-hover`}
    >
      {content}
    </Link>
  )
}

export function SeverityBreakdownCard({ counts, linkable }: Props) {
  return (
    <section aria-labelledby="severity-title" className={`${DASHBOARD_CARD} flex flex-col px-4 pb-6 sm:px-6`}>
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-neutral-300 py-5">
        <h2 id="severity-title" className="flex items-center gap-3 text-lg font-semibold text-neutral-950 sm:text-xl">
          <MdErrorOutline aria-hidden className="size-6 shrink-0 text-neutral-500" />
          Não Conformidades por Criticidade
        </h2>
        <p className="text-sm text-neutral-700">Total: {NUMBER.format(nonConformityTotal(counts))}</p>
      </header>

      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
        {SEVERITIES.toReversed().map((severity) => (
          <li key={severity} className="min-w-0">
            <Tile severity={severity} count={counts[severity]} linkable={linkable} />
          </li>
        ))}
      </ul>
    </section>
  )
}
