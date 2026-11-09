import Link from 'next/link'
import { MdArrowBack, MdOutlineConstruction } from 'react-icons/md'

import { FlashNotice } from '@/components/ui/notice'
import { CARD, LINK } from '@/components/ui/styles'
import { TemplateStatusBadge } from '@/features/templates/template-status-badge'
import { loadTemplate } from '@/features/templates/templates-data'
import { requireRole } from '@/lib/dal'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { param } from '@/lib/search-params'

/**
 * Destino do rascunho recem-criado (issue #13: "abre direto no construtor").
 *
 * Provisoria: o construtor de secoes e itens e a issue #14. Ate la a pagina
 * confirma o modelo aberto, para "criar e abrir" nunca terminar em erro.
 */
export default async function TemplateBuilderPage(props: PageProps<'/inspection-templates/[templateId]/edit'>) {
  await requireRole(MANAGER_ROLES)
  const { templateId } = await props.params
  const template = await loadTemplate(templateId)

  return (
    <div className="flex flex-col gap-6">
      <Link href="/inspection-templates" className={`${LINK} inline-flex w-fit items-center gap-1.5 text-sm`}>
        <MdArrowBack aria-hidden className="size-4" />
        Modelos de Inspeção
      </Link>

      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">{template.title}</h1>
          <TemplateStatusBadge template={template} />
        </div>
        <p className="text-neutral-700">Categoria: {template.category}</p>
      </header>

      <FlashNotice code={param(await props.searchParams, 'notice')} />

      <div className={`${CARD} flex flex-col items-center gap-3 border-dashed px-6 py-14 text-center`}>
        <MdOutlineConstruction aria-hidden className="size-8 text-neutral-300" />
        <p className="text-sm font-medium text-neutral-700">Construtor em construção</p>
        <p className="max-w-sm text-sm text-neutral-500">
          A montagem de seções e itens deste modelo chega com a issue #14.
        </p>
      </div>
    </div>
  )
}
