import { redirect } from 'next/navigation'

import { requireRole } from '@/lib/dal'
import { MANAGER_ROLES } from '@/lib/domain/user'

/**
 * O modelo nao tem tela de detalhe propria: o endereco dele leva ao construtor.
 * Sem isto, o passo "Detalhe" do breadcrumb de `/edit` apontaria para um 404.
 */
export default async function TemplatePage(props: PageProps<'/inspection-templates/[templateId]'>) {
  await requireRole(MANAGER_ROLES)
  const { templateId } = await props.params
  redirect(`/inspection-templates/${encodeURIComponent(templateId)}/edit`)
}
