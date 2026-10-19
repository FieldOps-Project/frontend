import Link from 'next/link'

import type { Page } from '@/lib/domain/page'
import { withParams } from '@/lib/search-params'

const LINK =
  'rounded-field border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100'

/**
 * Paginacao ligada ao parametro `page` da URL. Os demais filtros viajam junto,
 * senao trocar de pagina desfaria a busca.
 */
export function Pagination({
  page,
  pathname,
  params,
}: {
  page: Page<unknown>
  pathname: string
  params: Record<string, string | undefined>
}) {
  if (page.totalElements === 0) {
    return null
  }

  const from = page.page * page.size + 1
  const to = from + page.content.length - 1

  return (
    <nav
      aria-label="Paginação"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 px-4 py-3 text-sm text-neutral-500"
    >
      <span>
        {from}–{to} de {page.totalElements}
      </span>
      <div className="flex items-center gap-2">
        {page.first ? (
          <span className={`${LINK} pointer-events-none opacity-40`}>Anterior</span>
        ) : (
          <Link className={LINK} href={withParams(pathname, { ...params, page: page.page - 1 })}>
            Anterior
          </Link>
        )}
        <span>
          Página {page.page + 1} de {Math.max(page.totalPages, 1)}
        </span>
        {page.last ? (
          <span className={`${LINK} pointer-events-none opacity-40`}>Próxima</span>
        ) : (
          <Link className={LINK} href={withParams(pathname, { ...params, page: page.page + 1 })}>
            Próxima
          </Link>
        )}
      </div>
    </nav>
  )
}
