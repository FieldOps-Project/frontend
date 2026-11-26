import type { Metadata } from 'next'

import { loadActiveUsers, loadClients, loadEquipment, loadSites } from '@/features/catalog/lookups'
import { todayInSaoPaulo } from '@/features/inspections/schedule-validation'
import { ScheduleForm } from '@/features/inspections/schedule-form'
import { loadPublishedTemplateVersions } from '@/features/inspections/scheduling-data'
import { requireRole } from '@/lib/dal'
import { MANAGER_ROLES } from '@/lib/domain/user'

export const metadata: Metadata = {
  title: 'Nova inspeção — FieldOps',
}

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

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2 border-b border-neutral-200 pb-6">
        <h1 className="text-4xl font-semibold tracking-tight text-neutral-950">Criar nova inspeção</h1>
        <p className="text-base text-neutral-700">Configure e atribua uma nova tarefa de inspeção.</p>
      </header>

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
