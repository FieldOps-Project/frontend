import Link from 'next/link'
import { MdArrowBack } from 'react-icons/md'

import { Notice } from '@/components/ui/notice'
import { BuilderToolbar } from '@/features/templates/builder/builder-toolbar'
import { ChecklistPreview } from '@/features/templates/preview/checklist-preview'
import { loadTemplateDetail } from '@/features/templates/templates-data'
import { requireRole } from '@/lib/dal'
import { MANAGER_ROLES } from '@/lib/domain/user'

/**
 * Previa do rascunho (issue #15 e documento 14.3): o checklist como o tecnico
 * vai ve-lo no aplicativo, numa coluna da largura de um celular, somente
 * leitura.
 */
export default async function TemplatePreviewPage(props: PageProps<'/inspection-templates/[templateId]/preview'>) {
  await requireRole(MANAGER_ROLES)
  const { templateId } = await props.params
  const template = await loadTemplateDetail(templateId)

  return (
    <div className="flex flex-col gap-6">
      <BuilderToolbar template={template} current="Prévia">
        <Link
          href={`/inspection-templates/${template.id}/edit`}
          className="inline-flex h-11 items-center gap-2 rounded-md border border-neutral-300 bg-neutral-0 px-4 text-[15px] font-medium text-neutral-900 hover:bg-neutral-100"
        >
          <MdArrowBack aria-hidden className="size-5" />
          Voltar ao construtor
        </Link>
      </BuilderToolbar>

      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <Notice tone="info">Prévia somente leitura: é assim que o técnico vê o checklist no aplicativo.</Notice>
        <header className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-neutral-950">{template.title}</h1>
          {template.description && <p className="text-sm text-neutral-600">{template.description}</p>}
        </header>
        <ChecklistPreview sections={template.sections} />
      </div>
    </div>
  )
}
