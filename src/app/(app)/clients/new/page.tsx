import { PageHeader } from '@/components/ui/page-header'
import { CARD } from '@/components/ui/styles'
import { createClient } from '@/features/clients/actions'
import { ClientForm } from '@/features/clients/client-form'
import { requireRole } from '@/lib/dal'
import { MANAGER_ROLES } from '@/lib/domain/user'

export default async function NewClientPage() {
  await requireRole(MANAGER_ROLES)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Novo cliente" description="O cliente é criado ativo." />
      <section className={`${CARD} p-6`}>
        <ClientForm action={createClient} submitLabel="Criar cliente" />
      </section>
    </div>
  )
}
