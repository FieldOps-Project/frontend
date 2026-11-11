'use client'

import Link from 'next/link'
import { useState } from 'react'
import { MdOutlineChecklistRtl, MdOutlineVisibility } from 'react-icons/md'

import { PublicationIssuesDialog } from '@/features/templates/builder/publication-issues-dialog'
import { BAR_BUTTON } from '@/features/templates/builder/styles'
import { publicationIssues } from '@/features/templates/publication-check'
import type { InspectionTemplateDetail } from '@/lib/domain/template-builder'
import type { PublicationIssue } from '@/lib/domain/template-publication'

/**
 * Botoes do topo do construtor, como no desenho do Stitch: pre-visualizar,
 * validar pendencias e publicar versao (issue #15).
 */
export function BuilderActionsBar({ template }: { template: InspectionTemplateDetail }) {
  const [issues, setIssues] = useState<readonly PublicationIssue[] | null>(null)

  return (
    <>
      <Link href={`/inspection-templates/${template.id}/preview`} className={BAR_BUTTON}>
        <MdOutlineVisibility aria-hidden className="size-5" />
        Pré-visualizar
      </Link>
      <button type="button" onClick={() => setIssues(publicationIssues(template))} className={BAR_BUTTON}>
        <MdOutlineChecklistRtl aria-hidden className="size-5" />
        Validar pendências
      </button>

      {issues && <PublicationIssuesDialog issues={issues} onClose={() => setIssues(null)} />}
    </>
  )
}
