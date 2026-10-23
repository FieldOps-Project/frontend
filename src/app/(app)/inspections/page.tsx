import Link from 'next/link'
import { IoAddOutline } from 'react-icons/io5'

import { EmptyState } from '@/components/ui/empty-state'
import { FlashNotice, Notice } from '@/components/ui/notice'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { BUTTON_PRIMARY, CARD } from '@/components/ui/styles'
import { Table, Td } from '@/components/ui/table'
import { load, requireRole } from '@/lib/dal'
import {
  INSPECTION_STATUS_LABELS,
  INSPECTION_STATUS_TONES,
  isInspectionStatus,
  type InspectionSummary,
} from '@/lib/domain/inspection'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { formatDateTime } from '@/lib/format'
import { param } from '@/lib/search-params'

/**
 * Acompanhamento de inspecoes (issue #17). A API ja publica o contrato de
 * listagem, mas ainda responde com um exemplo fixo; filtros, paginacao e as
 * acoes de agendar e revisar chegam com os endpoints de inspecao.
 */
export default async function InspectionsPage(props: PageProps<'/inspections'>) {
  await requireRole(MANAGER_ROLES)
  const searchParams = await props.searchParams
  const inspections = await load<readonly InspectionSummary[]>('/inspections')

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Inspeções"
        description="Acompanhamento das inspeções agendadas e em execução."
        actions={
          <Link href="/inspections/new" className={BUTTON_PRIMARY}>
            <IoAddOutline aria-hidden className="size-4" />
            Nova inspeção
          </Link>
        }
      />

      <FlashNotice code={param(searchParams, 'notice')} />

      <Notice tone="warning">
        Dados de exemplo: a API já publica o contrato desta listagem, mas ainda devolve uma inspeção fixa. O
        agendamento e a revisão já têm tela, com dados de demonstração até os endpoints do backend chegarem.
      </Notice>

      <section className={CARD}>
        {inspections.length === 0 ? (
          <EmptyState title="Nenhuma inspeção" />
        ) : (
          <Table caption="Inspeções" head={['Inspeção', 'Estado', 'Data prevista']}>
            {inspections.map((inspection) => (
              <tr key={inspection.id}>
                <Td className="font-medium text-neutral-900">{inspection.title}</Td>
                <Td>
                  {isInspectionStatus(inspection.status) ? (
                    <StatusBadge
                      label={INSPECTION_STATUS_LABELS[inspection.status]}
                      tone={INSPECTION_STATUS_TONES[inspection.status]}
                    />
                  ) : (
                    <StatusBadge label={inspection.status} tone="neutral" />
                  )}
                </Td>
                <Td className="whitespace-nowrap">{formatDateTime(inspection.scheduledAt)}</Td>
              </tr>
            ))}
          </Table>
        )}
      </section>
    </div>
  )
}
