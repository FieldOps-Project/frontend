'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { MdOutlineChecklistRtl, MdOutlinePublish, MdOutlineVisibility } from 'react-icons/md'

import { useConfirm } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast'
import { publishTemplate } from '@/features/templates/builder-actions'

import { PublicationIssuesDialog } from '@/features/templates/builder/publication-issues-dialog'
import { BAR_BUTTON } from '@/features/templates/builder/styles'
import { publicationIssues } from '@/features/templates/publication-check'
import { draftVersionNumber, type InspectionTemplateDetail } from '@/lib/domain/template-builder'
import type { PublicationIssue } from '@/lib/domain/template-publication'

/**
 * Botoes do topo do construtor, como no desenho do Stitch: pre-visualizar,
 * validar pendencias e publicar versao (issue #15).
 */
export function BuilderActionsBar({ template }: { template: InspectionTemplateDetail }) {
  const [issues, setIssues] = useState<{ list: readonly PublicationIssue[]; message?: string } | null>(null)
  const [pending, startTransition] = useTransition()
  const ask = useConfirm()
  const notify = useToast()
  const router = useRouter()

  /**
   * Publicar confere as pendencias antes; com o rascunho pronto, a confirmacao
   * explica que a versao fica imutavel (issue #15) e a tela mostra o numero
   * gerado. Se a API recusar, abre as pendencias que ela devolveu.
   */
  async function publish() {
    const local = publicationIssues(template)
    if (local.length > 0) {
      setIssues({ list: local, message: 'Ainda não dá para publicar.' })
      return
    }

    const next = draftVersionNumber(template)
    const confirmed = await ask({
      title: `Publicar a versão ${next}?`,
      description:
        'A versão fica imutável: as perguntas dela não poderão mais ser alteradas. Ela passa a valer para novos agendamentos, e as inspeções já agendadas continuam com a versão que receberam. O rascunho continua editável para a próxima versão.',
      confirmLabel: `Publicar versão ${next}`,
    })
    if (!confirmed) return

    startTransition(async () => {
      const result = await publishTemplate(template.id)
      if (result.ok) {
        notify(result.message, 'success')
        router.refresh()
        return
      }
      if (result.issues.length > 0) setIssues({ list: result.issues, message: result.message })
      else notify(result.message, 'error')
    })
  }

  return (
    <>
      <Link href={`/inspection-templates/${template.id}/preview`} className={BAR_BUTTON}>
        <MdOutlineVisibility aria-hidden className="size-5" />
        Pré-visualizar
      </Link>
      <button type="button" onClick={() => setIssues({ list: publicationIssues(template) })} className={BAR_BUTTON}>
        <MdOutlineChecklistRtl aria-hidden className="size-5" />
        Validar pendências
      </button>
      <button
        type="button"
        onClick={() => void publish()}
        disabled={pending}
        className="inline-flex h-11 items-center gap-2 rounded-md bg-brand-700 px-5 text-[15px] font-semibold text-neutral-0 transition-colors hover:bg-brand-800 disabled:cursor-wait disabled:opacity-70"
      >
        <MdOutlinePublish aria-hidden className="size-5" />
        {pending ? 'Publicando…' : 'Publicar versão'}
      </button>

      {issues && <PublicationIssuesDialog issues={issues.list} message={issues.message} onClose={() => setIssues(null)} />}
    </>
  )
}
