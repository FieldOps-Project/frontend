import Link from 'next/link'
import { MdChevronRight, MdOutlineLocationOn } from 'react-icons/md'

import { SeverityBadge } from '@/features/dashboard/severity-badge'
import type { NonConformityListItem } from '@/lib/domain/non-conformity'
import { formatDateTime } from '@/lib/format'

const HEAD = 'px-5 py-4 text-left text-[13px] font-medium tracking-wider whitespace-nowrap text-neutral-700 uppercase'
const CELL = 'px-5 py-4 align-top'

function detailHref(item: NonConformityListItem): string {
  return `/non-conformities/${item.id}`
}

/** Celular e notebook pequeno: um cartao por nao conformidade, com a linha inteira como alvo do toque. */
function CardList({ items }: { items: readonly NonConformityListItem[] }) {
  return (
    <ul className="divide-y divide-neutral-200 lg:hidden">
      {items.map((item) => (
        <li key={item.id}>
          <Link href={detailHref(item)} className="flex items-center gap-3 px-4 py-4 hover:bg-neutral-50 sm:px-5">
            <span className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="flex flex-wrap items-center justify-between gap-2">
                <SeverityBadge severity={item.severity} />
                <span className="text-sm text-neutral-600">{formatDateTime(item.createdAtDevice)}</span>
              </span>
              <span className="font-medium text-neutral-950">{item.title}</span>
              <span className="text-sm text-neutral-700">
                {item.inspectionCode} · {item.clientName}
              </span>
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
  )
}

/**
 * Listagem das nao conformidades (issue #20), na ordem em que chega: da mais
 * grave para a menos grave. A criticidade vai escrita no selo (RN-054).
 */
export function NonConformityTable({ items }: { items: readonly NonConformityListItem[] }) {
  return (
    <>
      <CardList items={items} />
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[60rem]">
          <thead className="border-b border-neutral-200 bg-neutral-100">
            <tr>
              <th scope="col" className={HEAD}>
                Criticidade
              </th>
              <th scope="col" className={HEAD}>
                Não conformidade
              </th>
              <th scope="col" className={HEAD}>
                Inspeção
              </th>
              <th scope="col" className={HEAD}>
                Cliente &amp; local
              </th>
              <th scope="col" className={HEAD}>
                Registrada em
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-neutral-50">
                <td className={CELL}>
                  <SeverityBadge severity={item.severity} />
                </td>
                <td className={CELL}>
                  <div className="flex max-w-md flex-col gap-1">
                    <Link href={detailHref(item)} className="font-medium text-brand-700 hover:underline">
                      {item.title}
                    </Link>
                    <span className="line-clamp-2 text-sm text-neutral-600">{item.description}</span>
                    {item.itemCode && <span className="text-xs text-neutral-500">Item {item.itemCode}</span>}
                  </div>
                </td>
                <td className={CELL}>
                  <Link
                    href={`/inspections/${item.inspectionId}`}
                    className="text-neutral-900 hover:text-brand-700 hover:underline"
                  >
                    {item.inspectionCode}
                  </Link>
                </td>
                <td className={CELL}>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-neutral-900">{item.clientName}</span>
                    <span className="flex items-center gap-1 text-sm text-neutral-600">
                      <MdOutlineLocationOn aria-hidden className="size-3.5 shrink-0" />
                      {item.siteName}
                    </span>
                  </div>
                </td>
                <td className={`${CELL} whitespace-nowrap text-neutral-900`}>
                  <div className="flex flex-col gap-1">
                    {formatDateTime(item.createdAtDevice)}
                    <span className="text-xs text-neutral-600">por {item.createdByName}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
