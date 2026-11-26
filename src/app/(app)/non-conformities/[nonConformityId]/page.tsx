import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { loadNonConformity } from '@/features/non-conformities/non-conformities-data'
import {
  NonConformityContext,
  NonConformityEvidences,
  NonConformityHeader,
  NonConformityOrigin,
} from '@/features/non-conformities/non-conformity-view'
import { requireRole } from '@/lib/dal'
import { FIELD_FINDINGS_ROLES } from '@/lib/domain/non-conformity'
import { isId } from '@/lib/ids'

export const metadata: Metadata = {
  title: 'Não conformidade — FieldOps',
}

export default async function NonConformityPage(props: PageProps<'/non-conformities/[nonConformityId]'>) {
  await requireRole(FIELD_FINDINGS_ROLES)
  const { nonConformityId } = await props.params

  if (!isId(nonConformityId)) {
    notFound()
  }

  const item = await loadNonConformity(nonConformityId)

  return (
    <div className="flex flex-col gap-8">
      <NonConformityHeader item={item} />

      <NonConformityContext item={item} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <NonConformityOrigin item={item} />
        <NonConformityEvidences item={item} />
      </div>
    </div>
  )
}
