import { EmptyState } from '@/components/ui/empty-state'
import { Notice } from '@/components/ui/notice'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { CARD } from '@/components/ui/styles'
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

/**
 * Acompanhamento de inspecoes (issue #17). A API ja publica o contrato de
 * listagem, mas ainda responde com um exemplo fixo; filtros, paginacao e as
 * acoes de agendar e revisar chegam com os endpoints de inspecao.
 */
export default async function InspectionsPage() {
  await requireRole(MANAGER_ROLES)
  const inspections = await load<readonly InspectionSummary[]>('/inspections')

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Inspeções" description="Acompanhamento das inspeções agendadas e em execução." />

      <Notice tone="warning">
        Dados de exemplo: a API já publica o contrato desta listagem, mas ainda devolve uma inspeção fixa. O
        agendamento e a revisão chegam com os próximos endpoints do backend.
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
