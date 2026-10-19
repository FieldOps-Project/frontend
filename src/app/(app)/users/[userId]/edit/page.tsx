import { notFound } from 'next/navigation'

import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { CARD } from '@/components/ui/styles'
import { updateUser } from '@/features/users/actions'
import { UserAccessActions } from '@/features/users/user-access-actions'
import { UserForm } from '@/features/users/user-form'
import { load, requireRole } from '@/lib/dal'
import { USER_STATUS_LABELS, USER_STATUS_TONES, type User } from '@/lib/domain/user'
import { formatDateTime } from '@/lib/format'
import { isId } from '@/lib/ids'

export default async function EditUserPage(props: PageProps<'/users/[userId]/edit'>) {
  const me = await requireRole(['ADMIN'])
  const { userId } = await props.params
  if (!isId(userId)) notFound()

  const user = await load<User>(`/users/${userId}`)
  const isSelf = user.id === me.id

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={user.name} description={`Atualizado em ${formatDateTime(user.updatedAt)}`} />

      <section className={`${CARD} p-6`}>
        <UserForm action={updateUser.bind(null, user.id)} user={user} submitLabel="Salvar alterações" />
      </section>

      <section className={`${CARD} flex flex-col gap-4 p-6`}>
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-neutral-900">Acesso</h2>
          <p className="flex items-center gap-2 text-sm text-neutral-500">
            Situação atual:
            <StatusBadge label={USER_STATUS_LABELS[user.status]} tone={USER_STATUS_TONES[user.status]} />
          </p>
          {isSelf && (
            <p className="text-sm text-neutral-500">Esta é a sua conta: bloquear e inativar não estão disponíveis.</p>
          )}
        </div>
        <UserAccessActions id={user.id} status={user.status} isSelf={isSelf} />
      </section>
    </div>
  )
}
