import type { Metadata } from 'next'
import Link from 'next/link'
import { MdOutlineTaskAlt } from 'react-icons/md'

import { EmptyState } from '@/components/ui/empty-state'
import { Notice } from '@/components/ui/notice'
import { NumberedPagination } from '@/components/ui/numbered-pagination'
import { CARD } from '@/components/ui/styles'
import { isDemoReviewQueue, loadReviewQueue } from '@/features/inspections/review-queue-data'
import { ReviewQueueTable } from '@/features/inspections/review-queue-table'
import { requireRole } from '@/lib/dal'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { pageParam } from '@/lib/search-params'

export const metadata: Metadata = {
  title: 'Fila de revisão — FieldOps',
}

/**
 * Fila de revisao (issue #21): entrada do fluxo de revisao. Chega-se aqui pelos
 * atalhos do dashboard e pelo botao da listagem de inspecoes; o botao Revisar
 * abre a revisao com o caminho de volta para a fila.
 */
export default async function ReviewQueuePage(props: PageProps<'/inspections/review-queue'>) {
  const user = await requireRole(MANAGER_ROLES)
  const searchParams = await props.searchParams
  const page = await loadReviewQueue(pageParam(searchParams))
  const now = new Date()

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold tracking-tight text-neutral-950">Fila de revisão</h1>
        <p className="text-lg text-neutral-700">
          {user.role === 'SUPERVISOR'
            ? 'Inspeções enviadas sob sua responsabilidade, da que espera há mais tempo para a mais recente.'
            : 'Todas as inspeções enviadas aguardando revisão, da que espera há mais tempo para a mais recente.'}
        </p>
      </header>

      {isDemoReviewQueue() && (
        <Notice tone="warning">
          Dados de demonstração: a API ainda não publica a listagem de inspeções nem os ciclos de revisão. Na
          demonstração, todo supervisor vê a fila inteira.
        </Notice>
      )}

      <section aria-label="Fila" className={`${CARD} overflow-hidden`}>
        {page === null ? (
          <EmptyState
            title="Fila indisponível"
            description="A API ainda não publica a listagem de inspeções. Tente novamente mais tarde."
          />
        ) : page.totalElements === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <MdOutlineTaskAlt aria-hidden className="size-12 text-success" />
            <p className="text-lg font-semibold text-neutral-900">Tudo revisado!</p>
            <p className="max-w-sm text-sm text-neutral-600">
              Nenhuma inspeção aguardando revisão. As novas aparecem aqui assim que o técnico sincronizar.
            </p>
            <Link href="/inspections" className="text-sm font-medium text-brand-700 hover:underline">
              Ver todas as inspeções
            </Link>
          </div>
        ) : (
          <>
            <ReviewQueueTable items={page.content} now={now} />
            <NumberedPagination page={page} pathname="/inspections/review-queue" params={{}} />
          </>
        )}
      </section>
    </div>
  )
}
