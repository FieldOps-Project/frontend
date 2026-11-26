import Link from 'next/link'

import { EmptyState } from '@/components/ui/empty-state'
import { NumberedPagination } from '@/components/ui/numbered-pagination'
import { StatusBadge } from '@/components/ui/status-badge'
import { BUTTON_PRIMARY, CARD, INPUT } from '@/components/ui/styles'
import { INSPECTION_STATUS_LABELS, INSPECTION_STATUS_TONES, inspectionReference } from '@/lib/domain/inspection'
import type { InspectionListItem } from '@/lib/domain/inspection-list'
import type { Page } from '@/lib/domain/page'
import { formatDateTime } from '@/lib/format'

export function InspectionPicker({ page, search }: { page: Page<InspectionListItem>; search: string | undefined }) {
  return (
    <section aria-label="Escolher inspeção" className={`${CARD} overflow-hidden`}>
      <form action="/audit" role="search" className="flex flex-wrap items-end gap-3 border-b border-neutral-200 p-5">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <label htmlFor="audit-search" className="text-sm font-medium text-neutral-800">
            Buscar inspeção
          </label>
          <input
            id="audit-search"
            name="search"
            type="search"
            defaultValue={search}
            placeholder="Título, cliente ou local"
            className={`${INPUT} h-11`}
          />
        </div>
        <button type="submit" className={`${BUTTON_PRIMARY} h-11 px-5`}>
          Buscar
        </button>
      </form>

      {page.totalElements === 0 ? (
        <EmptyState
          title="Nenhuma inspeção encontrada"
          description={search ? 'Tente outro termo ou limpe a busca.' : 'Não há inspeções disponíveis para você.'}
        />
      ) : (
        <>
          <ul className="divide-y divide-neutral-200">
            {page.content.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/audit?inspectionId=${item.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-surface-hover"
                >
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate font-medium text-brand-700">
                      {inspectionReference(item.id)} · {item.title}
                    </span>
                    <span className="truncate text-sm text-neutral-600">
                      {item.clientName} · {item.siteName} · atualizada em {formatDateTime(item.updatedAt)}
                    </span>
                  </span>
                  <StatusBadge label={INSPECTION_STATUS_LABELS[item.status]} tone={INSPECTION_STATUS_TONES[item.status]} />
                </Link>
              </li>
            ))}
          </ul>
          <NumberedPagination page={page} pathname="/audit" params={{ search }} noun={['inspeção', 'inspeções']} />
        </>
      )}
    </section>
  )
}
