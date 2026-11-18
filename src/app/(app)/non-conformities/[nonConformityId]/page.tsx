import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Notice } from '@/components/ui/notice'
import { isDemoNonConformities, loadNonConformity } from '@/features/non-conformities/non-conformities-data'
import {
  NonConformityContext,
  NonConformityEvidences,
  NonConformityHeader,
  NonConformityOrigin,
} from '@/features/non-conformities/non-conformity-view'
import { requireRole } from '@/lib/dal'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { isId } from '@/lib/ids'

export const metadata: Metadata = {
  title: 'Não conformidade — FieldOps',
}

/**
 * Detalhe da nao conformidade (documento 14.12, issue #20): descricao,
 * criticidade, a inspecao a que pertence, o item que a originou e as
 * evidencias. Somente consulta -- no MVP nao ha tratamento nem mudanca de estado.
 */
export default async function NonConformityPage(props: PageProps<'/non-conformities/[nonConformityId]'>) {
  await requireRole(MANAGER_ROLES)
  const { nonConformityId } = await props.params

  if (!isId(nonConformityId)) {
    notFound()
  }

  const item = await loadNonConformity(nonConformityId)

  return (
    <div className="flex flex-col gap-8">
      <NonConformityHeader item={item} />

      {isDemoNonConformities() && (
        <Notice tone="warning">Dados de demonstração: a API ainda não publica as não conformidades.</Notice>
      )}

      <NonConformityContext item={item} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <NonConformityOrigin item={item} />
        <NonConformityEvidences item={item} />
      </div>
    </div>
  )
}
