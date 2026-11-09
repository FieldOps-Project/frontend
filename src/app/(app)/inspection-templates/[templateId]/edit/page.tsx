import { FlashNotice } from '@/components/ui/notice'
import { BuilderToolbar } from '@/features/templates/builder/builder-toolbar'
import { SectionCard } from '@/features/templates/builder/section-card'
import { TemplateConfigPanel } from '@/features/templates/builder/template-config-panel'
import { VersionHistory } from '@/features/templates/builder/version-history'
import { loadTemplateCategories, loadTemplateDetail, loadTemplateVersions } from '@/features/templates/templates-data'
import { requireRole } from '@/lib/dal'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { param } from '@/lib/search-params'

/**
 * Construtor de modelo (issue #14 e documento 14.8), no desenho do Stitch: o
 * painel do modelo a esquerda e as secoes com os itens a direita.
 *
 * Sempre edita o rascunho: publicar (issue #15) copia o rascunho para uma
 * versao imutavel, entao nada aqui altera inspecoes ja agendadas.
 */
export default async function TemplateBuilderPage(props: PageProps<'/inspection-templates/[templateId]/edit'>) {
  await requireRole(MANAGER_ROLES)
  const { templateId } = await props.params
  const [template, categories, versions] = await Promise.all([
    loadTemplateDetail(templateId),
    loadTemplateCategories(),
    loadTemplateVersions(templateId),
  ])

  return (
    <div className="flex flex-col gap-6">
      <BuilderToolbar template={template} />

      <FlashNotice code={param(await props.searchParams, 'notice')} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:grid-cols-[24rem_minmax(0,1fr)]">
        <aside
          aria-label="Configuração do modelo"
          className="flex flex-col overflow-hidden rounded-lg border border-neutral-300 bg-neutral-0 lg:sticky lg:top-6"
        >
          <div className="p-5 sm:p-6">
            <TemplateConfigPanel template={template} categories={categories} />
          </div>
          <div className="border-t border-neutral-200 bg-neutral-50 p-5 sm:p-6">
            <VersionHistory currentVersion={template.currentVersion} versions={versions} />
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-6">
          {template.sections.map((section) => (
            <SectionCard key={section.id} section={section} />
          ))}
        </div>
      </div>
    </div>
  )
}
