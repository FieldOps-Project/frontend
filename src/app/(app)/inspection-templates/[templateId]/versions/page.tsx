import Link from 'next/link'
import { MdArrowBack } from 'react-icons/md'

import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { CARD } from '@/components/ui/styles'
import { Table, Td } from '@/components/ui/table'
import { BuilderToolbar } from '@/features/templates/builder/builder-toolbar'
import {
  loadPublisherNames,
  loadTemplateDetail,
  loadTemplateVersions,
} from '@/features/templates/templates-data'
import { requireRole } from '@/lib/dal'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { formatDateTime } from '@/lib/format'

/**
 * Historico de versoes publicadas (issue #15 e documento 14.3): numero, autor,
 * data e se a versao aceita novos agendamentos (RN-022), com acesso ao
 * conteudo de cada uma.
 */
export default async function TemplateVersionsPage(props: PageProps<'/inspection-templates/[templateId]/versions'>) {
  const user = await requireRole(MANAGER_ROLES)
  const { templateId } = await props.params
  const [template, versions] = await Promise.all([loadTemplateDetail(templateId), loadTemplateVersions(templateId)])
  const names = await loadPublisherNames(
    versions.map((version) => version.publishedBy),
    user,
  )

  return (
    <div className="flex flex-col gap-6">
      <BuilderToolbar template={template} current="Versões">
        <Link
          href={`/inspection-templates/${template.id}/edit`}
          className="inline-flex h-11 items-center gap-2 rounded-md border border-neutral-300 bg-neutral-0 px-4 text-[15px] font-medium text-neutral-900 hover:bg-neutral-100"
        >
          <MdArrowBack aria-hidden className="size-5" />
          Voltar ao construtor
        </Link>
      </BuilderToolbar>

      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">Versões publicadas</h1>
        <p className="text-neutral-700">
          Cada versão é uma cópia imutável do checklist. Inspeções guardam a versão que receberam.
        </p>
      </header>

      <section aria-label="Versões" className={`${CARD} overflow-hidden`}>
        {versions.length === 0 ? (
          <EmptyState
            title="Nenhuma versão publicada"
            description="Publique o rascunho no construtor para criar a primeira versão."
          />
        ) : (
          <Table caption="Versões publicadas" head={['Versão', 'Publicada por', 'Publicada em', 'Novos agendamentos', '']}>
            {versions.map((version) => (
              <tr key={version.id} className="hover:bg-neutral-50">
                <Td className="font-medium text-neutral-900">Versão {version.versionNumber}</Td>
                <Td>{(version.publishedBy && names.get(version.publishedBy)) ?? '—'}</Td>
                <Td>{formatDateTime(version.publishedAt)}</Td>
                <Td>
                  {version.activeForNewInspections ? (
                    <StatusBadge label="Aceita" tone="success" />
                  ) : (
                    <StatusBadge label="Não aceita" tone="neutral" />
                  )}
                </Td>
                <Td className="text-right whitespace-nowrap">
                  <Link
                    href={`/inspection-templates/${template.id}/versions/${version.id}`}
                    className="font-medium text-brand-700 hover:text-brand-800 hover:underline"
                  >
                    Ver conteúdo
                  </Link>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </section>
    </div>
  )
}
