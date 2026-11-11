import Link from 'next/link'
import type { ReactNode } from 'react'
import { MdAssignmentAdd, MdChevronRight } from 'react-icons/md'

import { draftVersionNumber, type InspectionTemplateDetail } from '@/lib/domain/template-builder'

/**
 * Caminho das paginas do modelo, como no desenho do Stitch: "Modelos de
 * Inspeção › Inspeção de Máquinas Pesadas – Versão 3 (rascunho)", com o passo
 * atual ("Prévia", "Versões") quando nao e o construtor. Substitui o breadcrumb
 * generico, que so diria "Detalhe › Editar". As acoes ficam a direita.
 *
 * O numero e o da versao que o rascunho vai gerar ao publicar (a API numera
 * versoes com inteiros, ADR-001).
 */
export function BuilderToolbar({
  template,
  current,
  children,
}: {
  template: Pick<InspectionTemplateDetail, 'id' | 'title' | 'currentVersion'>
  /** Passo atual depois do modelo; ausente no proprio construtor. */
  current?: string
  /** Acoes a direita do caminho. */
  children?: ReactNode
}) {
  const label = `${template.title} – Versão ${draftVersionNumber(template)} (rascunho)`

  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <nav aria-label="Você está em" className="flex min-w-0 items-center gap-2.5 text-sm sm:text-[15px]">
        <MdAssignmentAdd aria-hidden className="size-5 shrink-0 text-neutral-500" />
        <Link href="/inspection-templates" className="shrink-0 text-neutral-600 hover:text-neutral-900 hover:underline">
          Modelos de Inspeção
        </Link>
        <MdChevronRight aria-hidden className="size-5 shrink-0 text-neutral-400" />
        {current ? (
          <>
            <Link
              href={`/inspection-templates/${template.id}/edit`}
              className="min-w-0 truncate text-neutral-600 hover:text-neutral-900 hover:underline"
            >
              {label}
            </Link>
            <MdChevronRight aria-hidden className="size-5 shrink-0 text-neutral-400" />
            <span aria-current="page" className="shrink-0 font-semibold text-neutral-950">
              {current}
            </span>
          </>
        ) : (
          <span aria-current="page" className="min-w-0 truncate font-semibold text-neutral-950">
            {label}
          </span>
        )}
      </nav>
      {children && <div className="flex shrink-0 flex-wrap items-center gap-3">{children}</div>}
    </div>
  )
}
