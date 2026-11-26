import Link from 'next/link'
import { MdOutlinePhotoLibrary } from 'react-icons/md'

import { EvidenceThumbnails } from '@/features/evidence/evidence-viewer'
import { groupByNonConformity, isPendingUpload, type Evidence } from '@/lib/domain/evidence'

export function EvidenceGallery({ evidences }: { evidences: readonly Evidence[] | null }) {
  const pending = evidences?.filter(isPendingUpload).length ?? 0

  return (
    <section aria-labelledby="evidence-title" className="flex flex-col gap-5 rounded-card border border-neutral-200 bg-neutral-0 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="evidence-title" className="flex items-center gap-3 text-lg font-semibold text-neutral-900">
          <MdOutlinePhotoLibrary aria-hidden className="size-6 text-neutral-600" />
          Evidências
          {evidences && <span className="text-sm font-normal text-neutral-600">({evidences.length})</span>}
        </h2>
        {pending > 0 && (
          <span className="rounded-full border border-warning/30 bg-warning-soft px-3 py-1 text-sm text-warning">
            {pending} aguardando upload
          </span>
        )}
      </div>

      {evidences === null ? (
        <p className="text-sm text-neutral-600">
          Evidências indisponíveis para o seu perfil: só o Supervisor consulta as fotografias de campo.
        </p>
      ) : evidences.length === 0 ? (
        <p className="text-sm text-neutral-600">Nenhuma fotografia registrada nesta inspeção.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-neutral-200">
          {groupByNonConformity(evidences).map((group) => (
            <li key={group.key} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
              <h3 className="text-base font-medium text-neutral-900">
                {group.nonConformityId ? (
                  <Link href={`/non-conformities/${group.nonConformityId}`} className="text-brand-700 hover:underline">
                    {group.title ?? 'Não conformidade'}
                  </Link>
                ) : (
                  'Sem não conformidade'
                )}
              </h3>
              <EvidenceThumbnails
                photos={group.evidences}
                label={group.title ? `Fotos de ${group.title}` : 'Fotos sem não conformidade'}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
