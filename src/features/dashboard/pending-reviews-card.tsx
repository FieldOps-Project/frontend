import Link from 'next/link'
import type { ReactNode } from 'react'
import { MdOutlinePendingActions, MdOutlineRateReview } from 'react-icons/md'

import { DASHBOARD_CARD } from '@/features/dashboard/styles'

const NUMBER = new Intl.NumberFormat('pt-BR')

const CARD_CLASS = `${DASHBOARD_CARD} group relative flex flex-col justify-center gap-3 overflow-hidden px-6 py-6 transition-colors`

type Props = {
  readonly count: number
  readonly reviewable: boolean
}

function Frame({ reviewable, children }: { reviewable: boolean; children: ReactNode }) {
  if (!reviewable) {
    return <div className={CARD_CLASS}>{children}</div>
  }

  return (
    <Link
      href="/inspections/review-queue"
      aria-labelledby="pending-reviews-title"
      aria-describedby="pending-reviews-count"
      className={`${CARD_CLASS} hover:border-tertiary-300`}
    >
      {children}
    </Link>
  )
}

export function PendingReviewsCard({ count, reviewable }: Props) {
  return (
    <Frame reviewable={reviewable}>
      <MdOutlineRateReview
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-5 size-24 -translate-y-1/2 text-neutral-100 transition-colors group-hover:text-tertiary-50"
      />

      <span className="relative flex items-center gap-4 pr-10">
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-tertiary-50 text-tertiary-700">
          <MdOutlinePendingActions aria-hidden className="size-6" />
        </span>
        <span id="pending-reviews-title" className="text-lg font-semibold text-neutral-950 sm:text-xl">
          Revisões Pendentes
        </span>
      </span>

      <span id="pending-reviews-count" className="relative flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-[40px] leading-none font-semibold tabular-nums text-neutral-950">{NUMBER.format(count)}</span>
        {count > 0 ? (
          <span className="rounded-sm bg-tertiary-50 px-2.5 py-1 text-sm font-medium text-tertiary-700">
            {reviewable ? 'Requer Ação' : 'Com o supervisor'}
          </span>
        ) : (
          <span className="rounded-sm bg-neutral-100 px-2.5 py-1 text-sm font-medium text-neutral-600">Nada pendente</span>
        )}
      </span>
    </Frame>
  )
}
