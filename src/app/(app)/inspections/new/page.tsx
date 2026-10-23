import type { Metadata } from 'next'

import { Notice } from '@/components/ui/notice'
import { loadActiveUsers, loadClients, loadEquipment, loadSites } from '@/features/catalog/lookups'
import { todayInSaoPaulo } from '@/features/inspections/schedule-validation'
import { ScheduleForm } from '@/features/inspections/schedule-form'
import { DEMO_TEMPLATE_VERSIONS, loadPublishedTemplateVersions } from '@/features/inspections/scheduling-data'
import { requireRole } from '@/lib/dal'
import { MANAGER_ROLES } from '@/lib/domain/user'

export const metadata: Metadata = {
  title: 'Nova inspeção — FieldOps',
}

/**
 * Agendamento de inspecao (issue #16, rota do documento 14.3).
 *
 * Administrador e supervisor agendam (matriz 5.2). O catalogo chega filtrado:
 * so clientes, locais e equipamentos ativos (RN-012), locais de clientes ativos,
 * equipamentos de locais ativos e tecnicos ativos (RN-027).
 */
export default async function NewInspectionPage() {
  await requireRole(MANAGER_ROLES)

  const [templates, clients, sites, equipment, technicians, supervisors] = await Promise.all([
    loadPublishedTemplateVersions(),
    loadClients('ACTIVE'),
    loadSites('ACTIVE'),
    loadEquipment('ACTIVE'),
    loadActiveUsers('TECHNICIAN'),
    loadActiveUsers('SUPERVISOR'),
  ])

  const clientIds = new Set(clients.map((client) => client.id))
  const activeSites = sites.filter((site) => clientIds.has(site.clientId))
  const siteIds = new Set(activeSites.map((site) => site.id))
  const usingDemoTemplates = templates === DEMO_TEMPLATE_VERSIONS

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2 border-b border-neutral-200 pb-6">
        <h1 className="text-4xl font-semibold tracking-tight text-neutral-950">Criar nova inspeção</h1>
        <p className="text-base text-neutral-700">Configure e atribua uma nova tarefa de inspeção.</p>
      </header>

      {usingDemoTemplates && (
        <Notice tone="warning">
          Modelos de demonstração: a API ainda não publica versões de modelo nem o agendamento. O formulário valida
          tudo, mas não envia a inspeção.
        </Notice>
      )}

      <div className="max-w-5xl">
        <ScheduleForm
          today={todayInSaoPaulo()}
          catalog={{
            templates,
            clients: clients.map(({ id, name }) => ({ id, name })),
            sites: activeSites.map(({ id, clientId, name, city }) => ({ id, clientId, name, city })),
            equipment: equipment
              .filter((item) => siteIds.has(item.siteId))
              .map(({ id, siteId, name, assetNumber }) => ({ id, siteId, name, assetNumber })),
            technicians: technicians.map(({ id, name }) => ({ id, name })),
            supervisors: supervisors.map(({ id, name }) => ({ id, name })),
          }}
        />
      </div>
    </div>
  )
}
