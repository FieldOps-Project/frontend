'use client'

import { useRouter } from 'next/navigation'
import { useTransition, type ReactNode } from 'react'
import { MdOutlineCalendarToday, MdOutlineCategory, MdOutlineFilterList, MdOutlinePerson } from 'react-icons/md'

import { auditFilterParams, hasActiveAuditFilters } from '@/features/audit/audit-filters'
import {
  AUDIT_ENTITY_LABELS,
  AUDIT_ENTITY_TYPES,
  AUDIT_PERIOD_LABELS,
  AUDIT_PERIODS,
  DEFAULT_AUDIT_PERIOD,
  type AuditFilters,
} from '@/lib/domain/audit'
import { withParams } from '@/lib/search-params'

type Option = { readonly value: string; readonly label: string }

const SELECT =
  'h-11 w-full appearance-none rounded-field border border-neutral-200 bg-neutral-0 pr-9 pl-10 text-base text-neutral-900 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 focus:outline-none'

/** Seletor com icone a esquerda e seta a direita, como os campos do Stitch. */
function Field({
  id,
  label,
  icon,
  value,
  onChange,
  children,
}: {
  id: string
  label: string
  icon: ReactNode
  value: string
  onChange: (value: string) => void
  children: ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-neutral-800">
        {label}
      </label>
      <div className="relative">
        <span aria-hidden className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-neutral-500 [&>svg]:size-5">
          {icon}
        </span>
        <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={SELECT}>
          {children}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 fill-neutral-600"
        >
          <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z" />
        </svg>
      </div>
    </div>
  )
}

/**
 * Filtros da auditoria (Stitch "Auditoria de Sistema" e issue #24): periodo,
 * usuario e tipo de acao, mais a entidade, que a issue exige e o Stitch nao
 * tem. Cada mudanca vai para a URL e volta a primeira pagina.
 */
export function AuditFiltersBar({
  filters,
  actors,
  actions,
}: {
  filters: AuditFilters
  actors: readonly Option[]
  actions: readonly Option[]
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  function update(patch: Partial<AuditFilters>) {
    startTransition(() => {
      router.push(withParams('/audit', auditFilterParams({ ...filters, ...patch })), { scroll: false })
    })
  }

  return (
    <section aria-label="Filtros" role="search" className="rounded-card border border-neutral-200 bg-neutral-0 p-5">
      <div className="grid items-end gap-4 sm:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
        <Field
          id="audit-period"
          label="Período"
          icon={<MdOutlineCalendarToday />}
          value={filters.period}
          onChange={(value) => update({ period: value as AuditFilters['period'] })}
        >
          {AUDIT_PERIODS.map((period) => (
            <option key={period} value={period}>
              {AUDIT_PERIOD_LABELS[period]}
            </option>
          ))}
        </Field>
        <Field
          id="audit-actor"
          label="Usuário"
          icon={<MdOutlinePerson />}
          value={filters.actorId ?? ''}
          onChange={(value) => update({ actorId: value || undefined })}
        >
          <option value="">Todos os Usuários</option>
          {actors.map((actor) => (
            <option key={actor.value} value={actor.value}>
              {actor.label}
            </option>
          ))}
        </Field>
        <Field
          id="audit-entity"
          label="Entidade"
          icon={<MdOutlineCategory />}
          value={filters.entityType ?? ''}
          onChange={(value) => update({ entityType: (value || undefined) as AuditFilters['entityType'] })}
        >
          <option value="">Todas as Entidades</option>
          {AUDIT_ENTITY_TYPES.map((type) => (
            <option key={type} value={type}>
              {AUDIT_ENTITY_LABELS[type]}
            </option>
          ))}
        </Field>
        <Field
          id="audit-action"
          label="Tipo de Ação"
          icon={<MdOutlineFilterList />}
          value={filters.action ?? ''}
          onChange={(value) => update({ action: value || undefined })}
        >
          <option value="">Todas as Ações</option>
          {actions.map((action) => (
            <option key={action.value} value={action.value}>
              {action.label}
            </option>
          ))}
        </Field>
        <button
          type="button"
          onClick={() => update({ period: DEFAULT_AUDIT_PERIOD, actorId: undefined, entityType: undefined, action: undefined, inspectionId: undefined })}
          disabled={!hasActiveAuditFilters(filters)}
          className="h-11 rounded-field border border-neutral-300 bg-neutral-100 px-5 text-base font-semibold text-neutral-900 transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Limpar
        </button>
      </div>
    </section>
  )
}
