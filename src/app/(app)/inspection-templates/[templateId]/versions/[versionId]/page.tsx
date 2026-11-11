import Link from 'next/link'
import { MdArrowBack, MdOutlineLock } from 'react-icons/md'

import { BuilderToolbar } from '@/features/templates/builder/builder-toolbar'
import { ChecklistPreview } from '@/features/templates/preview/checklist-preview'
import { loadPublisherNames, loadTemplateDetail, loadTemplateVersion } from '@/features/templates/templates-data'
import { requireRole } from '@/lib/dal'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { formatDateTime } from '@/lib/format'

/**
 * Conteudo de uma versao publicada (issue #15), somente leitura: explica por
 * que uma inspecao antiga tem perguntas diferentes das do rascunho atual
 * (RN-019 e RN-021).
 */
export default async function TemplateVersionPage(
  props: PageProps<'/inspection-templates/[templateId]/versions/[versionId]'>,
) {
  const user = await requireRole(MANAGER_ROLES)
  const { templateId, versionId } = await props.params
  const [template, version] = await Promise.all([loadTemplateDetail(templateId), loadTemplateVersion(templateId, versionId)])
  const names = await loadPublisherNames([version.publishedBy], user)
  const publisher = version.publishedBy ? names.get(version.publishedBy) : undefined

  return (
    <div className="flex flex-col gap-6">
      <BuilderToolbar template={template} current={`Versão ${version.versionNumber}`}>
        <Link
          href={`/inspection-templates/${template.id}/versions`}
          className="inline-flex h-11 items-center gap-2 rounded-md border border-neutral-300 bg-neutral-0 px-4 text-[15px] font-medium text-neutral-900 hover:bg-neutral-100"
        >
          <MdArrowBack aria-hidden className="size-5" />
          Todas as versões
        </Link>
      </BuilderToolbar>

      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <p className="flex gap-3 rounded-md border border-neutral-300 bg-neutral-100 px-4 py-3 text-sm text-neutral-700">
          <MdOutlineLock aria-hidden className="mt-0.5 size-5 shrink-0" />
          <span>
            Versão {version.versionNumber} publicada em {formatDateTime(version.publishedAt)}
            {publisher ? ` por ${publisher}` : ''}. Versão publicada não muda: é o checklist que as inspeções desta versão
            receberam.
            {!version.activeForNewInspections && ' Não aceita novos agendamentos.'}
          </span>
        </p>
        <header className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-neutral-950">{version.title}</h1>
          {version.description && <p className="text-sm text-neutral-600">{version.description}</p>}
        </header>
        <ChecklistPreview sections={version.sections} />
      </div>
    </div>
  )
}
