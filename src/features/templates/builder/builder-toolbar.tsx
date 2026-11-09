import Link from 'next/link'
import { MdAssignmentAdd, MdChevronRight } from 'react-icons/md'

import { draftVersionNumber, type InspectionTemplateDetail } from '@/lib/domain/template-builder'

/**
 * Caminho do construtor, como no desenho do Stitch: "Modelos de Inspeção ›
 * Inspeção de Máquinas Pesadas – Versão 3 (rascunho)". Substitui o breadcrumb
 * generico nesta tela, que so diria "Detalhe › Editar".
 *
 * O numero e o da versao que o rascunho vai gerar ao publicar (a API numera
 * versoes com inteiros, ADR-001).
 */
export function BuilderToolbar({ template }: { template: Pick<InspectionTemplateDetail, 'title' | 'currentVersion'> }) {
  return (
    <nav aria-label="Você está em" className="flex min-w-0 items-center gap-2.5 text-sm sm:text-[15px]">
      <MdAssignmentAdd aria-hidden className="size-5 shrink-0 text-neutral-500" />
      <Link href="/inspection-templates" className="shrink-0 text-neutral-600 hover:text-neutral-900 hover:underline">
        Modelos de Inspeção
      </Link>
      <MdChevronRight aria-hidden className="size-5 shrink-0 text-neutral-400" />
      <span aria-current="page" className="min-w-0 truncate font-semibold text-neutral-950">
        {template.title} – Versão {draftVersionNumber(template)} (rascunho)
      </span>
    </nav>
  )
}
