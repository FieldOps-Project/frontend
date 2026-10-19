import Link from 'next/link'
import { IoAddOutline } from 'react-icons/io5'

import { EmptyState } from '@/components/ui/empty-state'
import { FilterBar, FilterSearch, FilterSelect } from '@/components/ui/filter-bar'
import { FlashNotice } from '@/components/ui/notice'
import { PageHeader } from '@/components/ui/page-header'
import { Pagination } from '@/components/ui/pagination'
import { StatusBadge } from '@/components/ui/status-badge'
import { BUTTON_PRIMARY, CARD, LINK } from '@/components/ui/styles'
import { Table, Td } from '@/components/ui/table'
import { load, requireRole } from '@/lib/dal'
import { DEFAULT_PAGE_SIZE, type Page } from '@/lib/domain/page'
import {
  USER_ROLE_LABELS,
  USER_ROLES,
  USER_STATUS_LABELS,
  USER_STATUS_TONES,
  USER_STATUSES,
  type User,
} from '@/lib/domain/user'
import { formatDateTime } from '@/lib/format'
import { oneOf, pageParam, param } from '@/lib/search-params'

export default async function UsersPage(props: PageProps<'/users'>) {
  const me = await requireRole(['ADMIN'])
  const searchParams = await props.searchParams

  const filters = {
    name: param(searchParams, 'name'),
    email: param(searchParams, 'email'),
    role: oneOf(searchParams, 'role', USER_ROLES),
    status: oneOf(searchParams, 'status', USER_STATUSES),
  }

  const page = await load<Page<User>>('/users', {
    ...filters,
    page: pageParam(searchParams),
    size: DEFAULT_PAGE_SIZE,
    sort: 'name,asc',
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Usuários"
        description="Contas de acesso ao painel e ao aplicativo de campo."
        actions={
          <Link href="/users/new" className={BUTTON_PRIMARY}>
            <IoAddOutline aria-hidden className="size-4" />
            Novo usuário
          </Link>
        }
      />

      <FlashNotice code={param(searchParams, 'notice')} />

      <section className={CARD}>
        <FilterBar pathname="/users">
          <FilterSearch name="name" label="Nome" defaultValue={filters.name} />
          <FilterSearch name="email" label="E-mail" defaultValue={filters.email} />
          <FilterSelect
            name="role"
            label="Perfil"
            defaultValue={filters.role}
            options={USER_ROLES.map((value) => ({ value, label: USER_ROLE_LABELS[value] }))}
          />
          <FilterSelect
            name="status"
            label="Situação"
            defaultValue={filters.status}
            allLabel="Todas"
            options={USER_STATUSES.map((value) => ({ value, label: USER_STATUS_LABELS[value] }))}
          />
        </FilterBar>

        {page.content.length === 0 ? (
          <EmptyState title="Nenhum usuário encontrado" description="Ajuste os filtros ou limpe a busca." />
        ) : (
          <Table caption="Usuários" head={['Nome', 'E-mail', 'Perfil', 'Situação', 'Atualizado em', '']}>
            {page.content.map((user) => (
              <tr key={user.id} className="hover:bg-neutral-50">
                <Td>
                  <span className="font-medium text-neutral-900">{user.name}</span>
                  {user.id === me.id && <span className="ml-2 text-xs text-neutral-500">(você)</span>}
                </Td>
                <Td>{user.email}</Td>
                <Td className="whitespace-nowrap">{USER_ROLE_LABELS[user.role]}</Td>
                <Td>
                  <StatusBadge label={USER_STATUS_LABELS[user.status]} tone={USER_STATUS_TONES[user.status]} />
                </Td>
                <Td className="whitespace-nowrap">{formatDateTime(user.updatedAt)}</Td>
                <Td>
                  <Link href={`/users/${user.id}/edit`} className={LINK}>
                    Editar
                  </Link>
                </Td>
              </tr>
            ))}
          </Table>
        )}

        <Pagination page={page} pathname="/users" params={filters} />
      </section>
    </div>
  )
}
