import { redirect } from 'next/navigation'

/** O breadcrumb liga ao segmento do usuario; o detalhe do cadastro e a propria edicao. */
export default async function UserPage(props: PageProps<'/users/[userId]'>) {
  const { userId } = await props.params
  redirect(`/users/${encodeURIComponent(userId)}/edit`)
}
