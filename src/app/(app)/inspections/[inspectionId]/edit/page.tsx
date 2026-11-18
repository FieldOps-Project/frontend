import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { IoArrowBack } from 'react-icons/io5'

import { Notice } from '@/components/ui/notice'
import { isDemoInspection, loadInspectionDetail, loadPlanningPeople } from '@/features/inspections/detail-data'
import { PlanningForm } from '@/features/inspections/planning-form'
import { todayInSaoPaulo } from '@/features/inspections/schedule-validation'
import { requireRole } from '@/lib/dal'
import { canEditPlanning, scheduledDateInSaoPaulo } from '@/lib/domain/inspection-detail'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { isId } from '@/lib/ids'

export const metadata: Metadata = {
  title: 'Editar planejamento — FieldOps',
}

/**
 * Edicao do planejamento da inspecao (documento 14.9, issue #18). Depois que o
 * tecnico inicia a execucao, a rota mostra o bloqueio em vez do formulario,
 * mesmo para quem chegar pelo endereco direto.
 */
export default async function EditInspectionPlanningPage(props: PageProps<'/inspections/[inspectionId]/edit'>) {
  await requireRole(MANAGER_ROLES)
  const { inspectionId } = await props.params

  if (!isId(inspectionId)) {
    notFound()
  }

  const [inspection, people] = await Promise.all([loadInspectionDetail(inspectionId), loadPlanningPeople(inspectionId)])
  const editable = canEditPlanning(inspection.status)

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2 border-b border-neutral-200 pb-6">
        <Link
          href={`/inspections/${inspection.id}`}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
        >
          <IoArrowBack aria-hidden className="size-4" />
          {inspection.code}
        </Link>
        <h1 className="text-4xl font-semibold tracking-tight text-neutral-950">Editar planejamento</h1>
        <p className="text-base text-neutral-700">
          {inspection.title} · {inspection.clientName}
        </p>
      </header>

      {isDemoInspection(inspection.id) && (
        <Notice tone="warning">
          Dados de demonstração: a API ainda não tem PUT /inspections/{'{id}'}. As alterações ficam guardadas até
          reiniciar o servidor.
        </Notice>
      )}

      {editable ? (
        <div className="max-w-5xl">
          <PlanningForm
            inspectionId={inspection.id}
            today={todayInSaoPaulo()}
            technicians={people.technicians}
            supervisors={people.supervisors}
            initial={{
              technicianId: inspection.technicianId,
              supervisorId: inspection.supervisorId,
              scheduledDate: scheduledDateInSaoPaulo(inspection.scheduledFor),
              priority: inspection.priority,
              instructions: inspection.instructions,
            }}
            fixed={{
              template: `${inspection.templateTitle} · v${inspection.templateVersionNumber}`,
              client: inspection.clientName,
              site: inspection.siteName,
              equipment: inspection.equipmentName ?? 'Inspeção geral do local',
            }}
          />
        </div>
      ) : (
        <Notice tone="info">
          O planejamento desta inspeção está bloqueado: ele só pode ser alterado antes de o técnico iniciar a execução.
        </Notice>
      )}
    </div>
  )
}
