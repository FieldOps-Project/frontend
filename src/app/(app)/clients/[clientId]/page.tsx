import { redirect } from 'next/navigation'

/** O breadcrumb liga ao segmento do cliente; o detalhe do cadastro e a propria edicao. */
export default async function ClientPage(props: PageProps<'/clients/[clientId]'>) {
  const { clientId } = await props.params
  redirect(`/clients/${encodeURIComponent(clientId)}/edit`)
}
