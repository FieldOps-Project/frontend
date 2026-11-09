import { MdHistory, MdOutlineInfo } from 'react-icons/md'

import { draftVersionNumber, type TemplateVersionSummary } from '@/lib/domain/template-builder'
import { formatRecentDate } from '@/lib/format'

/** "Publicada em 12 de out. de 2026", "Publicada hoje, 09:45" ou "Publicada ontem". */
function publishedLabel(publishedAt: string): string {
  const when = formatRecentDate(publishedAt)
  return /^\d/.test(when) ? `Publicada em ${when}` : `Publicada ${when.toLowerCase()}`
}

/**
 * "Histórico de Versões" do desenho do construtor: o rascunho em edicao no
 * topo e as versoes publicadas abaixo, mais nova primeiro. O aviso explica por
 * que editar e seguro: publicar cria uma versao nova, e as inspecoes ja
 * agendadas continuam com a que receberam (RN-021).
 */
export function VersionHistory({
  currentVersion,
  versions,
}: {
  currentVersion: number | null
  versions: readonly TemplateVersionSummary[]
}) {
  return (
    <section aria-labelledby="version-history-title" className="flex flex-col gap-5">
      <h2 id="version-history-title" className="flex items-center gap-2.5 text-lg font-semibold text-neutral-950">
        <MdHistory aria-hidden className="size-6 shrink-0 text-neutral-700" />
        Histórico de Versões
      </h2>

      <ol className="flex flex-col">
        <li className="relative flex gap-4 pb-5">
          {versions.length > 0 && <span aria-hidden className="absolute top-4 bottom-0 left-[5px] w-0.5 bg-brand-700" />}
          <span aria-hidden className="relative mt-1.5 size-3 shrink-0 rounded-full bg-brand-700" />
          <span className="flex flex-col">
            <span className="font-semibold text-neutral-950">Versão {draftVersionNumber({ currentVersion })} (Atual)</span>
            <span className="text-sm text-neutral-600">Editando rascunho…</span>
          </span>
        </li>

        {versions.map((version, index) => (
          <li key={version.id} className="relative flex gap-4 pb-5 last:pb-0">
            {index < versions.length - 1 && (
              <span aria-hidden className="absolute top-4 bottom-0 left-[5px] w-0.5 bg-neutral-200" />
            )}
            <span aria-hidden className="relative mt-1.5 size-3 shrink-0 rounded-full bg-neutral-300" />
            <span className="flex flex-col">
              <span className="font-semibold text-neutral-950">Versão {version.versionNumber}</span>
              <span className="text-sm text-neutral-600">{publishedLabel(version.publishedAt)}</span>
              {!version.activeForNewInspections && (
                <span className="text-xs text-neutral-500">Não aceita novos agendamentos</span>
              )}
            </span>
          </li>
        ))}
      </ol>

      {versions.length === 0 && <p className="-mt-2 text-sm text-neutral-500">Nenhuma versão publicada ainda.</p>}

      <p className="flex gap-3 rounded-md border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-800">
        <MdOutlineInfo aria-hidden className="mt-0.5 size-5 shrink-0" />
        A edição atual não afeta as inspeções em andamento. Uma nova versão será criada ao publicar.
      </p>
    </section>
  )
}
