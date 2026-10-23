import Link from 'next/link'

import type { Page } from '@/lib/domain/page'
import { withParams } from '@/lib/search-params'

const BOX =
  'inline-flex h-9 min-w-9 items-center justify-center rounded-field border px-3 text-sm transition-colors'
const IDLE = `${BOX} border-neutral-200 bg-neutral-0 text-neutral-800 hover:bg-neutral-100`
const CURRENT = `${BOX} border-brand-700 bg-brand-700 font-semibold text-neutral-0`
const DISABLED = `${BOX} border-neutral-200 bg-neutral-0 text-neutral-400`

/**
 * Paginas mostradas: todas quando cabem, senao a primeira, a ultima e as
 * vizinhas da atual, com reticencias no buraco. Indices comecam em zero.
 */
export function pageWindow(current: number, total: number): readonly (number | 'gap')[] {
  if (total <= 5) return Array.from({ length: total }, (_, index) => index)

  const pages = new Set([0, total - 1, current - 1, current, current + 1].filter((page) => page >= 0 && page < total))
  if (current <= 1) pages.add(2)
  if (current >= total - 2) pages.add(total - 3)

  const sorted = [...pages].sort((a, b) => a - b)
  const result: (number | 'gap')[] = []
  sorted.forEach((page, index) => {
    const previous = sorted[index - 1]
    if (previous !== undefined && page - previous > 1) result.push('gap')
    result.push(page)
  })
  return result
}

/**
 * Rodape de listagem com contagem e paginas numeradas, guiado pela URL: cada
 * pagina e um link que preserva os filtros, entao voltar e recarregar funcionam.
 */
export function NumberedPagination({
  page,
  pathname,
  params,
}: {
  page: Page<unknown>
  pathname: string
  params: Record<string, string | undefined>
}) {
  if (page.totalElements === 0) return null

  const from = page.page * page.size + 1
  const to = from + page.content.length - 1
  const href = (target: number) => withParams(pathname, { ...params, page: target === 0 ? undefined : target })

  return (
    <nav
      aria-label="Paginação"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 px-6 py-4 text-sm text-neutral-700"
    >
      <p>
        Mostrando <strong className="font-semibold text-neutral-900">{from}</strong> a{' '}
        <strong className="font-semibold text-neutral-900">{to}</strong> de{' '}
        <strong className="font-semibold text-neutral-900">{page.totalElements}</strong>{' '}
        {page.totalElements === 1 ? 'resultado' : 'resultados'}
      </p>
      <ul className="flex items-center gap-2">
        <li>
          {page.first ? (
            <span aria-disabled="true" className={DISABLED}>
              Anterior
            </span>
          ) : (
            <Link href={href(page.page - 1)} className={IDLE}>
              Anterior
            </Link>
          )}
        </li>
        {pageWindow(page.page, page.totalPages).map((item, index) =>
          item === 'gap' ? (
            <li key={`gap-${index}`} aria-hidden className="px-1 text-neutral-500">
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                href={href(item)}
                aria-current={item === page.page ? 'page' : undefined}
                aria-label={`Página ${item + 1}`}
                className={item === page.page ? CURRENT : IDLE}
              >
                {item + 1}
              </Link>
            </li>
          ),
        )}
        <li>
          {page.last ? (
            <span aria-disabled="true" className={DISABLED}>
              Próxima
            </span>
          ) : (
            <Link href={href(page.page + 1)} className={IDLE}>
              Próxima
            </Link>
          )}
        </li>
      </ul>
    </nav>
  )
}
