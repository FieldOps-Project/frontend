'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { IoClose, IoSearchOutline } from 'react-icons/io5'

import { INPUT } from '@/components/ui/styles'
import { filterParams } from '@/features/inspections/list-filters'
import { INSPECTION_STATUS_LABELS, INSPECTION_STATUSES } from '@/lib/domain/inspection'
import type { InspectionFilters as Filters } from '@/lib/domain/inspection-list'
import { INSPECTION_PRIORITIES, INSPECTION_PRIORITY_LABELS } from '@/lib/domain/inspection-scheduling'
import { withParams } from '@/lib/search-params'

type Option = { readonly value: string; readonly label: string }

const FIELD_LABEL = 'text-sm font-medium tracking-wider text-neutral-700 uppercase'
const SEARCH_DELAY_MS = 400

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 text-base text-neutral-800"
    >
      <span
        aria-hidden
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-brand-700' : 'bg-neutral-200'
        }`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-neutral-0 shadow transition-transform ${
            checked ? 'translate-x-5.5' : 'translate-x-0.5'
          }`}
        />
      </span>
      {label}
    </button>
  )
}

function FilterSelect({
  id,
  label,
  value,
  allLabel,
  options,
  onChange,
}: {
  id: string
  label: string
  value: string | undefined
  allLabel: string
  options: readonly Option[]
  onChange: (value: string | undefined) => void
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={id} className={FIELD_LABEL}>
        {label}
      </label>
      <select
        id={id}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value || undefined)}
        className={`${INPUT} h-11`}
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function formatDay(day: string): string {
  const [year, month, date] = day.split('-')
  return `${date}/${month}/${year}`
}

/**
 * Filtros do acompanhamento (issue #17).
 *
 * Cada mudanca vai direto para a URL -- a pagina e o filtro sao o mesmo link,
 * que sobrevive ao recarregamento e pode virar favorito -- e volta a primeira
 * pagina. A busca espera a pessoa parar de digitar. Os atalhos "somente
 * atrasadas" e "aguardando revisao" sao os recortes mais usados; os chips de
 * filtros ativos removem um filtro por vez.
 */
export function InspectionFilters({
  pathname,
  filters,
  technicians,
  clients,
}: {
  pathname: string
  filters: Filters
  technicians: readonly Option[]
  clients: readonly Option[]
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [query, setQuery] = useState(filters.q ?? '')
  const lastApplied = useRef(filters.q ?? '')

  function apply(next: Filters) {
    startTransition(() => {
      router.push(withParams(pathname, filterParams(next)), { scroll: false })
    })
  }

  function update(patch: Partial<Filters>) {
    apply({ ...filters, q: lastApplied.current || undefined, ...patch })
  }

  useEffect(() => {
    if (query === lastApplied.current) return
    const timer = setTimeout(() => {
      lastApplied.current = query
      apply({ ...filters, q: query.trim() || undefined })
    }, SEARCH_DELAY_MS)
    return () => clearTimeout(timer)
    // `filters` muda a cada navegacao; a busca so reage ao texto digitado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const technicianName = new Map(technicians.map((option) => [option.value, option.label]))
  const clientName = new Map(clients.map((option) => [option.value, option.label]))

  const chips: { key: keyof Filters; label: string }[] = [
    filters.q ? { key: 'q' as const, label: `Busca: ${filters.q}` } : null,
    filters.status ? { key: 'status' as const, label: `Status: ${INSPECTION_STATUS_LABELS[filters.status]}` } : null,
    filters.technicianId
      ? { key: 'technicianId' as const, label: `Técnico: ${technicianName.get(filters.technicianId) ?? '—'}` }
      : null,
    filters.clientId ? { key: 'clientId' as const, label: `Cliente: ${clientName.get(filters.clientId) ?? '—'}` } : null,
    filters.priority ? { key: 'priority' as const, label: `Prioridade: ${INSPECTION_PRIORITY_LABELS[filters.priority]}` } : null,
    filters.date ? { key: 'date' as const, label: `Data: ${formatDay(filters.date)}` } : null,
    filters.overdue ? { key: 'overdue' as const, label: 'Somente atrasadas' } : null,
    filters.review ? { key: 'review' as const, label: 'Aguardando revisão' } : null,
  ].filter((chip) => chip !== null)

  function remove(key: keyof Filters) {
    if (key === 'q') {
      setQuery('')
      lastApplied.current = ''
    }
    update({ [key]: undefined })
  }

  function clearAll() {
    setQuery('')
    lastApplied.current = ''
    apply({})
  }

  return (
    <section
      aria-label="Filtros"
      role="search"
      className="flex flex-col gap-5 rounded-card border border-neutral-200 bg-neutral-0 p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <label className="relative w-full max-w-md">
          <span className="sr-only">Buscar inspeções</span>
          <IoSearchOutline aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-neutral-500" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por ID, título, cliente..."
            className={`${INPUT} h-11 bg-neutral-50 pl-10 text-base`}
          />
        </label>
        <div className="flex flex-wrap items-center gap-4">
          <Toggle label="Somente atrasadas" checked={Boolean(filters.overdue)} onChange={(next) => update({ overdue: next })} />
          <span aria-hidden className="hidden h-6 w-px bg-neutral-200 sm:block" />
          <Toggle label="Aguardando revisão" checked={Boolean(filters.review)} onChange={(next) => update({ review: next })} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <FilterSelect
          id="filter-status"
          label="Status"
          value={filters.status}
          allLabel="Todos os Status"
          options={INSPECTION_STATUSES.map((status) => ({ value: status, label: INSPECTION_STATUS_LABELS[status] }))}
          onChange={(value) => update({ status: value as Filters['status'] })}
        />
        <FilterSelect
          id="filter-technician"
          label="Técnico"
          value={filters.technicianId}
          allLabel="Qualquer Técnico"
          options={technicians}
          onChange={(value) => update({ technicianId: value })}
        />
        <FilterSelect
          id="filter-client"
          label="Cliente"
          value={filters.clientId}
          allLabel="Todos os Clientes"
          options={clients}
          onChange={(value) => update({ clientId: value })}
        />
        <FilterSelect
          id="filter-priority"
          label="Prioridade"
          value={filters.priority}
          allLabel="Todas"
          options={INSPECTION_PRIORITIES.map((priority) => ({ value: priority, label: INSPECTION_PRIORITY_LABELS[priority] }))}
          onChange={(value) => update({ priority: value as Filters['priority'] })}
        />
        <div className="flex min-w-0 flex-col gap-2">
          <label htmlFor="filter-date" className={FIELD_LABEL}>
            Data
          </label>
          <input
            id="filter-date"
            type="date"
            value={filters.date ?? ''}
            onChange={(event) => update({ date: event.target.value || undefined })}
            className={`${INPUT} h-11`}
          />
        </div>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-t border-neutral-200 pt-4">
          <span className="text-base text-neutral-700">Filtros ativos:</span>
          <ul className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <li key={chip.key}>
                <button
                  type="button"
                  onClick={() => remove(chip.key)}
                  aria-label={`Remover filtro ${chip.label}`}
                  className="inline-flex items-center gap-2 rounded-field bg-neutral-100 px-3 py-1.5 text-base text-neutral-900 hover:bg-neutral-200"
                >
                  {chip.label}
                  <IoClose aria-hidden className="size-4" />
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={clearAll} className="text-base font-medium text-brand-700 hover:underline">
            Limpar todos
          </button>
        </div>
      )}
    </section>
  )
}
