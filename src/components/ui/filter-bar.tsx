import Link from 'next/link'
import type { ReactNode } from 'react'
import { IoSearchOutline } from 'react-icons/io5'

import { BUTTON_PRIMARY, BUTTON_SECONDARY, INPUT } from '@/components/ui/styles'

/**
 * Barra de filtros como formulario `GET`: o estado dos filtros e a propria URL.
 * Funciona sem JavaScript, e o Server Component le os mesmos parametros de
 * `searchParams`. Filtrar sempre volta para a primeira pagina.
 */
export function FilterBar({
  pathname,
  children,
  hidden,
}: {
  pathname: string
  children: ReactNode
  hidden?: Record<string, string | undefined>
}) {
  return (
    <form
      method="get"
      action={pathname}
      role="search"
      className="flex flex-wrap items-end gap-3 border-b border-neutral-200 p-4"
    >
      {Object.entries(hidden ?? {}).map(([name, value]) =>
        value ? <input key={name} type="hidden" name={name} value={value} /> : null,
      )}
      {children}
      <div className="flex gap-2">
        <button type="submit" className={BUTTON_PRIMARY}>
          <IoSearchOutline aria-hidden className="size-4" />
          Filtrar
        </button>
        <Link href={pathname} className={BUTTON_SECONDARY}>
          Limpar
        </Link>
      </div>
    </form>
  )
}

export function FilterSearch({ name = 'search', label, defaultValue, placeholder }: {
  name?: string
  label: string
  defaultValue: string | undefined
  placeholder?: string
}) {
  return (
    <label className="flex min-w-48 flex-1 flex-col gap-1 text-xs font-medium text-neutral-500">
      {label}
      <input type="search" name={name} defaultValue={defaultValue} placeholder={placeholder} className={INPUT} />
    </label>
  )
}

export function FilterSelect({
  name,
  label,
  defaultValue,
  options,
  allLabel = 'Todos',
}: {
  name: string
  label: string
  defaultValue: string | undefined
  options: readonly { value: string; label: string }[]
  allLabel?: string
}) {
  return (
    <label className="flex min-w-40 flex-col gap-1 text-xs font-medium text-neutral-500">
      {label}
      <select name={name} defaultValue={defaultValue ?? ''} className={INPUT}>
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
