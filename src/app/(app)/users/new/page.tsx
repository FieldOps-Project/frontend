import { PageHeader } from '@/components/ui/page-header'
import { CARD } from '@/components/ui/styles'
import { createUser } from '@/features/users/actions'
import { UserForm } from '@/features/users/user-form'
import { requireRole } from '@/lib/dal'

export default async function NewUserPage() {
  await requireRole(['ADMIN'])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Novo usuário" description="A senha é gravada com hash e nunca volta a ser exibida." />
      <section className={`${CARD} p-6`}>
        <UserForm action={createUser} submitLabel="Criar usuário" />
      </section>
    </div>
  )
}
