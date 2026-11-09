import { MdOutlineAnalytics } from 'react-icons/md'

import { PipelineTile } from '@/features/dashboard/pipeline-tile'
import { DASHBOARD_CARD } from '@/features/dashboard/styles'
import { activeTotal } from '@/lib/domain/dashboard'
import { INSPECTION_STATUSES, type InspectionStatus } from '@/lib/domain/inspection'

const NUMBER = new Intl.NumberFormat('pt-BR')

/** Total de inspecoes por estado (documento 14.5), com o total ainda no fluxo. */
export function PipelineCard({ counts }: { counts: Readonly<Record<InspectionStatus, number>> }) {
  return (
    <section aria-labelledby="pipeline-title" className={`${DASHBOARD_CARD} flex flex-col px-4 pb-6 sm:px-6`}>
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-neutral-300 py-5">
        <h2 id="pipeline-title" className="flex items-center gap-3 text-lg font-semibold text-neutral-950 sm:text-xl">
          <MdOutlineAnalytics aria-hidden className="size-6 shrink-0 text-neutral-500" />
          Status do Fluxo de Inspeções
        </h2>
        <p className="text-sm text-neutral-700">Total ativo: {NUMBER.format(activeTotal(counts))}</p>
      </header>

      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
        {INSPECTION_STATUSES.map((status) => (
          <li key={status} className="min-w-0">
            <PipelineTile status={status} count={counts[status] ?? 0} />
          </li>
        ))}
      </ul>
    </section>
  )
}
