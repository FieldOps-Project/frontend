'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import { INPUT } from '@/components/ui/styles'
import { filterParams, hasActiveFilters } from '@/features/non-conformities/list-filters'
import { SEVERITIES, SEVERITY_LABELS } from '@/lib/domain/inspection-review'
import type { NonConformityFilters as Filters } from '@/lib/domain/non-conformity'
import { withParams } from '@/lib/search-params'

type Option = { readonly value: string; readonly label: string }

const FIELD_LABEL = 'text-sm font-medium tracking-wider text-neutral-700 uppercase'

export function NonConformityFilters({ filters, clients }: { filters: Filters; clients: readonly Option[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  function update(patch: Partial<Filters>) {
    startTransition(() => {
      router.push(withParams('/non-conformities', filterParams({ ...filters, ...patch })), { scroll: false })
    })
  }

  return (
    <section aria-label="Filtros" role="search" className="rounded-card border border-neutral-200 bg-neutral-0 p-5">
      <div className="grid items-end gap-4 sm:grid-cols-[repeat(2,minmax(0,1fr))_auto]">
        <div className="flex min-w-0 flex-col gap-2">
          <label htmlFor="filter-severity" className={FIELD_LABEL}>
            Criticidade
          </label>
          <select
            id="filter-severity"
            value={filters.severity ?? ''}
            onChange={(event) => update({ severity: (event.target.value || undefined) as Filters['severity'] })}
            className={`${INPUT} h-11`}
          >
            <option value="">Todas</option>
            {SEVERITIES.toReversed().map((severity) => (
              <option key={severity} value={severity}>
                {SEVERITY_LABELS[severity]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <label htmlFor="filter-client" className={FIELD_LABEL}>
            Cliente
          </label>
          <select
            id="filter-client"
            value={filters.clientId ?? ''}
            onChange={(event) => update({ clientId: event.target.value || undefined })}
            className={`${INPUT} h-11`}
          >
            <option value="">Todos os Clientes</option>
            {clients.map((client) => (
              <option key={client.value} value={client.value}>
                {client.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => update({ severity: undefined, clientId: undefined })}
          disabled={!hasActiveFilters(filters)}
          className="h-11 rounded-field bg-neutral-100 px-5 text-base font-semibold text-neutral-900 transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Limpar
        </button>
      </div>
    </section>
  )
}
