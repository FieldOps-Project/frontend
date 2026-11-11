import { MdOutlineCameraAlt, MdOutlineComment } from 'react-icons/md'

import {
  failureLabel,
  itemNumber,
  type TemplateItem,
  type TemplateSection,
} from '@/lib/domain/template-builder'

const DISABLED_FIELD =
  'w-full rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-500'

function Choices({ labels, failure }: { labels: readonly string[]; failure?: string }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))] gap-2">
      {labels.map((label) => (
        <span
          key={label}
          className={`rounded-md border px-3 py-2.5 text-center text-sm font-medium ${
            label === failure ? 'border-danger/40 text-danger' : 'border-neutral-300 text-neutral-800'
          }`}
        >
          {label}
        </span>
      ))}
    </div>
  )
}

/**
 * Campo de resposta como o tecnico ve no aplicativo, sem poder responder: a
 * previa mostra a forma da resposta de cada tipo (RN-016), nao um formulario.
 */
export function AnswerField({ item }: { item: TemplateItem }) {
  switch (item.responseType) {
    case 'CONFORMITY':
      return <Choices labels={['Conforme', 'Não conforme', 'Não se aplica']} failure="Não conforme" />
    case 'BOOLEAN':
      return <Choices labels={['Sim', 'Não']} failure="Não" />
    case 'SINGLE_CHOICE':
      return (
        <ul className="flex flex-col gap-2">
          {item.options.map((option) => (
            <li key={option} className="flex items-center gap-3 rounded-md border border-neutral-300 px-3 py-2.5 text-sm text-neutral-800">
              <span aria-hidden className="size-4 shrink-0 rounded-full border-2 border-neutral-400" />
              {option}
            </li>
          ))}
        </ul>
      )
    case 'NUMBER':
      return <div className={DISABLED_FIELD}>Número</div>
    case 'DATE':
      return <div className={DISABLED_FIELD}>dd/mm/aaaa</div>
    case 'TEXT_LONG':
      return <div className={`${DISABLED_FIELD} min-h-20`}>Resposta em texto livre</div>
    case 'TEXT_SHORT':
      return <div className={DISABLED_FIELD}>Resposta curta</div>
  }
}

function PreviewItem({ item, sectionOrder }: { item: TemplateItem; sectionOrder: number }) {
  const failure = failureLabel(item.responseType)?.replace('se ', '')

  return (
    <li className="flex flex-col gap-3 px-4 py-4">
      <p className="text-[15px] font-medium text-neutral-950">
        <span className="mr-1.5 text-neutral-500 tabular-nums">{itemNumber(sectionOrder, item.displayOrder)}</span>
        {item.title}
        {item.required && (
          <span className="ml-1 text-danger" title="Obrigatório">
            *<span className="sr-only"> (obrigatório)</span>
          </span>
        )}
      </p>
      {item.description && <p className="-mt-1 text-sm text-neutral-600">{item.description}</p>}
      <AnswerField item={item} />
      {(item.observationRequiredOnFailure || item.evidenceRequiredOnFailure) && failure && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600">
          {item.observationRequiredOnFailure && (
            <li className="inline-flex items-center gap-1">
              <MdOutlineComment aria-hidden className="size-4" /> Observação obrigatória se “{failure}”
            </li>
          )}
          {item.evidenceRequiredOnFailure && (
            <li className="inline-flex items-center gap-1">
              <MdOutlineCameraAlt aria-hidden className="size-4" /> Foto obrigatória se “{failure}”
            </li>
          )}
        </ul>
      )}
    </li>
  )
}

/**
 * Checklist como o tecnico vai ve-lo no aplicativo (issue #15): secoes e itens
 * na ordem definida, cada um com o campo do seu tipo, sem nada editavel. Serve
 * a previa do rascunho e a consulta de versoes publicadas.
 */
export function ChecklistPreview({ sections }: { sections: readonly TemplateSection[] }) {
  const ordered = sections.toSorted((a, b) => a.displayOrder - b.displayOrder)

  if (ordered.length === 0) {
    return <p className="rounded-lg border border-neutral-300 bg-neutral-0 px-6 py-8 text-center text-sm text-neutral-600">Este checklist ainda não tem seções.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {ordered.map((section) => (
        <section key={section.id} aria-labelledby={`preview-${section.id}`} className="overflow-hidden rounded-lg border border-neutral-300 bg-neutral-0">
          <h2 id={`preview-${section.id}`} className="border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-base font-semibold text-neutral-950">
            {section.displayOrder}. {section.title}
          </h2>
          {section.items.length === 0 ? (
            <p className="px-4 py-4 text-sm text-neutral-500">Seção sem itens.</p>
          ) : (
            <ol className="divide-y divide-neutral-200">
              {section.items
                .toSorted((a, b) => a.displayOrder - b.displayOrder)
                .map((item) => (
                  <PreviewItem key={item.id} item={item} sectionOrder={section.displayOrder} />
                ))}
            </ol>
          )}
        </section>
      ))}
    </div>
  )
}
