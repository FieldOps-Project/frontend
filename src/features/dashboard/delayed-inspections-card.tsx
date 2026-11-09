import Link from 'next/link'
import { MdOutlineCloudDownload, MdOutlineWarningAmber } from 'react-icons/md'

import { overdueDelta, overdueDeltaLabel, type DashboardSummary } from '@/lib/domain/dashboard'

const NUMBER = new Intl.NumberFormat('pt-BR')

/**
 * Inspecoes atrasadas (documento 14.5), pela mesma regra de atraso da listagem
 * (issue #28), com a variacao desde o fim do dia anterior.
 *
 * O vermelho so aparece quando ha atraso: alerta aceso com zero ensina a
 * ignorar o cartao justamente no dia em que ele importar.
 */
export function DelayedInspectionsCard({ summary }: { summary: Pick<DashboardSummary, 'overdue' | 'overdueYesterday'> }) {
  const late = summary.overdue > 0
  const delta = overdueDelta(summary)

  return (
    <Link
      href="/inspections?overdue=1"
      aria-labelledby="delayed-title"
      aria-describedby="delayed-count"
      className={`group relative flex flex-col gap-3 overflow-hidden rounded-lg border px-6 py-6 transition-colors ${
        late ? 'border-danger/20 bg-danger-soft/30 hover:border-danger/40' : 'border-neutral-300 bg-neutral-0 hover:border-neutral-400'
      }`}
    >
      <MdOutlineWarningAmber
        aria-hidden
        className={`pointer-events-none absolute -top-2 -right-5 size-36 ${late ? 'text-danger/10' : 'text-neutral-100'}`}
      />

      <span className="relative flex items-center gap-4">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-md ${
            late ? 'bg-danger-soft text-danger' : 'bg-neutral-100 text-neutral-600'
          }`}
        >
          <MdOutlineCloudDownload aria-hidden className="size-6" />
        </span>
        <span id="delayed-title" className={`text-lg font-semibold sm:text-xl ${late ? 'text-danger' : 'text-neutral-950'}`}>
          Inspeções Atrasadas
        </span>
      </span>

      <span id="delayed-count" className="relative flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className={`text-[40px] leading-none font-semibold tabular-nums ${late ? 'text-danger' : 'text-neutral-950'}`}>
          {NUMBER.format(summary.overdue)}
        </span>
        <span
          className={`rounded-sm px-2.5 py-1 text-sm font-medium ${
            delta > 0 ? 'bg-danger-soft text-danger' : 'bg-neutral-100 text-neutral-600'
          }`}
        >
          {overdueDeltaLabel(delta)}
        </span>
      </span>
    </Link>
  )
}
