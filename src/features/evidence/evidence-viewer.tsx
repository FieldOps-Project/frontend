'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { MdChevronLeft, MdChevronRight, MdClose, MdOutlineCloudUpload, MdOutlineLocationOn } from 'react-icons/md'

import { evidenceSrc, isPendingUpload, type EvidencePhoto } from '@/lib/domain/evidence'
import { formatDateTime } from '@/lib/format'

const NAV_BUTTON =
  'grid size-11 place-items-center rounded-full bg-neutral-0/90 text-neutral-900 shadow-raised transition-colors hover:bg-neutral-0 disabled:opacity-40'

function photoLabel(photo: EvidencePhoto, index: number): string {
  return photo.description ?? `Foto ${index + 1}`
}

function Coordinates({ photo }: { photo: EvidencePhoto }) {
  if (photo.latitude === null || photo.longitude === null) {
    return <span className="text-neutral-600">Sem coordenadas registradas</span>
  }
  return (
    <span className="flex flex-wrap items-center gap-2">
      <MdOutlineLocationOn aria-hidden className="size-4 text-neutral-600" />
      <code className="font-mono text-sm">
        {photo.latitude.toFixed(6)}, {photo.longitude.toFixed(6)}
      </code>
      <a
        href={`https://www.openstreetmap.org/?mlat=${photo.latitude}&mlon=${photo.longitude}#map=18/${photo.latitude}/${photo.longitude}`}
        target="_blank"
        rel="noreferrer"
        className="text-sm font-medium text-brand-700 hover:underline"
      >
        Ver no mapa<span className="sr-only"> (abre em nova aba)</span>
      </a>
    </span>
  )
}

/**
 * Miniaturas das fotos de um item, com ampliacao (issue #19).
 *
 * A lista so carrega a miniatura, e preguicosa (`loading="lazy"`): inspecao com
 * dezenas de fotos abre sem baixar nenhum original. A resolucao integral vem so
 * na ampliacao, que mostra descricao, horario de captura e coordenadas. Foto com
 * arquivo pendente aparece como "Aguardando upload", sem imagem quebrada.
 * Nenhuma acao de exclusao e oferecida: evidencia de inspecao aprovada e
 * somente leitura (RN-049), e a exclusao auditada nao faz parte do painel.
 */
export function EvidenceThumbnails({ photos, label }: { photos: readonly EvidencePhoto[]; label: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const viewable = photos.filter((photo) => !isPendingUpload(photo))
  const current = openIndex === null ? undefined : viewable[openIndex]
  /** Posicao na lista completa, para "Foto N" ser o mesmo nome na miniatura e na ampliacao. */
  const currentPosition = current ? photos.indexOf(current) : -1

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (openIndex !== null && !dialog.open) dialog.showModal()
    if (openIndex === null && dialog.open) dialog.close()
  }, [openIndex])

  function move(step: number) {
    setOpenIndex((index) => (index === null ? null : Math.min(Math.max(index + step, 0), viewable.length - 1)))
  }

  return (
    <>
      <ul aria-label={label} className="flex flex-wrap gap-3">
        {photos.map((photo, index) => (
          <li key={photo.id} className="flex w-36 flex-col gap-1.5">
            {isPendingUpload(photo) ? (
              <div
                role="img"
                aria-label={`${photoLabel(photo, index)}: aguardando upload`}
                className="grid aspect-[4/3] place-items-center content-center gap-1 rounded-field border border-dashed border-warning/50 bg-warning-soft text-warning"
              >
                <MdOutlineCloudUpload aria-hidden className="size-7" />
                <span className="text-xs font-medium">Aguardando upload</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setOpenIndex(viewable.indexOf(photo))}
                aria-label={`Ampliar ${photoLabel(photo, index)}`}
                className="overflow-hidden rounded-field border border-neutral-200 bg-neutral-100 transition-shadow hover:shadow-raised focus-visible:ring-2 focus-visible:ring-brand-600"
              >
                <Image
                  src={evidenceSrc(photo.id, 'thumbnail')}
                  alt=""
                  width={320}
                  height={240}
                  loading="lazy"
                  unoptimized
                  className="aspect-[4/3] w-full object-cover"
                />
              </button>
            )}
            <span className="text-xs text-neutral-600">
              {photoLabel(photo, index)} · {formatDateTime(photo.capturedAtDevice)}
            </span>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        onClose={() => setOpenIndex(null)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') move(1)
          if (event.key === 'ArrowLeft') move(-1)
        }}
        aria-label="Evidência ampliada"
        className="m-auto w-[calc(100%-2rem)] max-w-5xl rounded-card border border-neutral-200 bg-surface-overlay p-0 shadow-overlay backdrop:bg-blanket-strong"
      >
        {current && openIndex !== null && (
          <div className="flex flex-col">
            <div className="relative bg-neutral-950">
              <Image
                src={evidenceSrc(current.id, 'original')}
                alt={photoLabel(current, currentPosition)}
                width={1600}
                height={1200}
                unoptimized
                className="mx-auto max-h-[70vh] w-auto object-contain"
              />
              <button
                type="button"
                onClick={() => setOpenIndex(null)}
                aria-label="Fechar"
                className={`${NAV_BUTTON} absolute top-3 right-3`}
              >
                <MdClose aria-hidden className="size-6" />
              </button>
              {viewable.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => move(-1)}
                    disabled={openIndex === 0}
                    aria-label="Foto anterior"
                    className={`${NAV_BUTTON} absolute top-1/2 left-3 -translate-y-1/2`}
                  >
                    <MdChevronLeft aria-hidden className="size-7" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(1)}
                    disabled={openIndex === viewable.length - 1}
                    aria-label="Próxima foto"
                    className={`${NAV_BUTTON} absolute top-1/2 right-3 -translate-y-1/2`}
                  >
                    <MdChevronRight aria-hidden className="size-7" />
                  </button>
                </>
              )}
            </div>
            <dl className="grid gap-4 p-5 text-sm sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <dt className="text-xs font-medium tracking-wider text-neutral-700 uppercase">Descrição</dt>
                <dd className="text-neutral-900">{current.description ?? 'Sem descrição'}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-xs font-medium tracking-wider text-neutral-700 uppercase">Capturada no dispositivo</dt>
                <dd className="text-neutral-900">{formatDateTime(current.capturedAtDevice)}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-xs font-medium tracking-wider text-neutral-700 uppercase">Coordenadas</dt>
                <dd className="text-neutral-900">
                  <Coordinates photo={current} />
                </dd>
              </div>
            </dl>
            {viewable.length > 1 && (
              <p className="border-t border-neutral-200 px-5 py-3 text-xs text-neutral-600">
                Foto {openIndex + 1} de {viewable.length} · use as setas do teclado para navegar
              </p>
            )}
          </div>
        )}
      </dialog>
    </>
  )
}
