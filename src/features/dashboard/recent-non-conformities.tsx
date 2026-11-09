import Link from 'next/link'
import { MdArrowForward, MdChevronRight, MdErrorOutline, MdOutlineLocationOn } from 'react-icons/md'

import { SeverityBadge } from '@/features/dashboard/severity-badge'
import { DASHBOARD_CARD } from '@/features/dashboard/styles'
import type { RecentNonConformity } from '@/lib/domain/dashboard'
import { formatRecentDate } from '@/lib/format'

const HEAD = 'px-6 py-4 text-left text-[13px] font-medium tracking-wider whitespace-nowrap text-neutral-700 uppercase'

function reviewHref(item: RecentNonConformity): string {
  return `/inspections/${item.inspectionId}/review`
}

function openLabel(item: RecentNonConformity): string {
  return `Abrir a inspeção ${item.inspectionCode}: ${item.title}`
}

/**
 * Nao conformidades mais recentes, com a criticidade a frente (documento 14.5).
 * A seta abre a revisao da inspecao em que a nao conformidade foi registrada,
 * onde estao o item, a resposta e as evidencias.
 *
 * Abaixo de 768px a tabela vira lista de cartoes: cinco colunas em 360px so
 * caberiam com rolagem lateral, e a linha inteira vira o alvo do toque.
 */
export function RecentNonConformities({ items }: { items: readonly RecentNonConformity[] }) {
  return (
    <section aria-labelledby="recent-nc-title" className={`${DASHBOARD_CARD} overflow-hidden`}>
      <header className="flex items-center justify-between gap-4 border-b border-neutral-300 px-4 py-5 sm:px-6">
        <h2 id="recent-nc-title" className="flex items-center gap-3 text-lg font-semibold text-neutral-950 sm:text-xl">
          <MdErrorOutline aria-hidden className="size-6 shrink-0 text-neutral-500" />
          Não Conformidades Recentes
        </h2>
        <Link
          href="/non-conformities"
          className="shrink-0 text-sm font-medium whitespace-nowrap text-brand-700 hover:text-brand-800 hover:underline"
        >
          Ver Todas
        </Link>
      </header>

      <ul className="divide-y divide-neutral-200 md:hidden">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={reviewHref(item)}
              aria-label={openLabel(item)}
              className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-neutral-50 sm:px-6"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="flex flex-wrap items-center justify-between gap-2">
                  <SeverityBadge severity={item.severity} />
                  <span className="text-sm text-neutral-600">{formatRecentDate(item.reportedAt)}</span>
                </span>
                <span className="text-[15px] text-neutral-950">{item.description}</span>
                <span className="flex items-center gap-1 text-sm text-neutral-600">
                  <MdOutlineLocationOn aria-hidden className="size-4 shrink-0" />
                  <span className="truncate">{item.siteName}</span>
                </span>
              </span>
              <MdChevronRight aria-hidden className="size-6 shrink-0 text-neutral-400" />
            </Link>
          </li>
        ))}
      </ul>

      <table className="hidden w-full table-fixed md:table">
        <thead className="border-b border-neutral-300">
          <tr>
            <th scope="col" className={`${HEAD} w-[11rem]`}>
              Criticidade
            </th>
            <th scope="col" className={HEAD}>
              Descrição
            </th>
            <th scope="col" className={`${HEAD} w-[22%]`}>
              Local
            </th>
            <th scope="col" className={`${HEAD} w-[17%]`}>
              Data do Registro
            </th>
            <th scope="col" className={`${HEAD} w-[6.5rem] text-right`}>
              Ação
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {items.map((item) => (
            <tr key={item.id} className="transition-colors hover:bg-neutral-50">
              <td className="px-6 py-5 align-middle">
                <SeverityBadge severity={item.severity} />
              </td>
              <td className="px-6 py-5 align-middle text-[15px] text-neutral-950">
                <span className="line-clamp-2" title={item.title}>
                  {item.description}
                </span>
              </td>
              <td className="truncate px-6 py-5 align-middle text-[15px] text-neutral-800">{item.siteName}</td>
              <td className="px-6 py-5 align-middle text-[15px] whitespace-nowrap text-neutral-800">
                {formatRecentDate(item.reportedAt)}
              </td>
              <td className="px-6 py-5 text-right align-middle">
                <Link
                  href={reviewHref(item)}
                  aria-label={openLabel(item)}
                  className="inline-grid size-9 place-items-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-brand-700"
                >
                  <MdArrowForward aria-hidden className="size-5" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
