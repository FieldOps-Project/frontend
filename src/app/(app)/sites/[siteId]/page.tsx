import { redirect } from 'next/navigation'

/** O breadcrumb liga ao segmento do local; o detalhe do cadastro e a propria edicao. */
export default async function SitePage(props: PageProps<'/sites/[siteId]'>) {
  const { siteId } = await props.params
  redirect(`/sites/${encodeURIComponent(siteId)}/edit`)
}
