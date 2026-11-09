import Form from 'next/form'
import Link from 'next/link'
import { MdChevronRight, MdSearch, MdOutlineSearchOff } from 'react-icons/md'

import { PageHeader } from '@/components/ui/page-header'
import { BUTTON_PRIMARY, CARD, INPUT_BARE, INPUT_BOX, LINK } from '@/components/ui/styles'
import { SEARCH_MIN_LENGTH, searchWorkspace } from '@/features/search/search-data'
import { requireRole } from '@/lib/dal'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { param } from '@/lib/search-params'

/**
 * Resultado da busca do cabecalho ("Pesquisar em todo o painel"). O termo vive
 * na URL, entao a busca vira link e sobrevive ao recarregamento.
 */
export default async function SearchPage(props: PageProps<'/search'>) {
  const user = await requireRole(MANAGER_ROLES)
  const term = param(await props.searchParams, 'q') ?? ''
  const ready = term.length >= SEARCH_MIN_LENGTH
  const groups = ready ? await searchWorkspace(term, user.role) : []
  const found = groups.some((group) => group.total > 0)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Busca"
        description={ready ? `Resultados para “${term}” em todo o painel.` : 'Pesquise inspeções, clientes, locais e equipamentos.'}
      />

      <Form action="/search" role="search" className="flex max-w-2xl flex-col gap-3 sm:flex-row">
        <label className={`${INPUT_BOX} h-11 flex-1`}>
          <MdSearch aria-hidden className="size-5 shrink-0 text-neutral-500" />
          <span className="sr-only">Termo da busca</span>
          <input
            name="q"
            type="search"
            defaultValue={term}
            minLength={SEARCH_MIN_LENGTH}
            placeholder="Código, cliente, local, equipamento…"
            className={INPUT_BARE}
          />
        </label>
        <button type="submit" className={`${BUTTON_PRIMARY} h-11 px-5`}>
          Buscar
        </button>
      </Form>

      {!ready && term !== '' && (
        <p className="text-sm text-neutral-500">Digite pelo menos {SEARCH_MIN_LENGTH} caracteres.</p>
      )}

      {ready && !found && (
        <div className={`${CARD} flex flex-col items-center gap-3 px-6 py-14 text-center`}>
          <MdOutlineSearchOff aria-hidden className="size-9 text-neutral-300" />
          <p className="text-sm font-medium text-neutral-700">Nada encontrado para “{term}”.</p>
          <p className="max-w-sm text-sm text-neutral-500">Confira a grafia ou tente parte do nome ou do código.</p>
        </div>
      )}

      {found && (
        <div className="grid gap-4 xl:grid-cols-2">
          {groups
            .filter((group) => group.total > 0)
            .map((group) => (
              <section key={group.key} aria-labelledby={`search-${group.key}`} className={CARD}>
                <header className="flex items-center justify-between gap-3 border-b border-neutral-200 px-5 py-3.5">
                  <h2 id={`search-${group.key}`} className="text-base font-semibold text-neutral-900">
                    {group.label} <span className="font-normal text-neutral-500">({group.total})</span>
                  </h2>
                  {group.total > group.hits.length && (
                    <Link href={group.moreHref} className={`${LINK} text-sm`}>
                      Ver todos
                    </Link>
                  )}
                </header>
                <ul className="divide-y divide-neutral-100">
                  {group.hits.map((hit) => (
                    <li key={hit.id}>
                      <Link href={hit.href} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-neutral-50">
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm font-medium text-neutral-900">{hit.title}</span>
                          {hit.detail && <span className="truncate text-xs text-neutral-500">{hit.detail}</span>}
                        </span>
                        <MdChevronRight aria-hidden className="size-5 shrink-0 text-neutral-400" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </div>
      )}
    </div>
  )
}
