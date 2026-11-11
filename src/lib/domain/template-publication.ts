import {
  itemNumber,
  type InspectionTemplateDetail,
  type TemplateSection,
  type TemplateVersionSummary,
} from '@/lib/domain/template-builder'

/**
 * Publicacao de versao de modelo (issue #15, UC-05): a versao publicada com o
 * conteudo congelado e as pendencias que impedem publicar.
 */

/** Versao publicada com o conteudo (`TemplateVersionDetailResponse`). */
export type TemplateVersionDetail = TemplateVersionSummary & {
  readonly description: string | null
  readonly sections: readonly TemplateSection[]
}

/** Onde a pendencia esta, para o link levar ao ponto exato do construtor. */
export type IssueTarget =
  | { readonly kind: 'template' }
  | { readonly kind: 'section'; readonly id: string }
  | { readonly kind: 'item'; readonly id: string }

export type PublicationIssue = {
  readonly message: string
  readonly target: IssueTarget
}

/** Ancora do elemento no construtor (`id` no HTML). */
export function issueAnchor(target: IssueTarget): string {
  if (target.kind === 'section') return `section-${target.id}`
  if (target.kind === 'item') return `item-${target.id}`
  return 'template-config'
}

function sorted(sections: readonly TemplateSection[]): readonly TemplateSection[] {
  return sections
    .toSorted((a, b) => a.displayOrder - b.displayOrder)
    .map((section) => ({ ...section, items: section.items.toSorted((a, b) => a.displayOrder - b.displayOrder) }))
}

/** Mensagem da pendencia de item: "Item 1.2 “Pergunta”: motivo". */
function itemMessage(section: TemplateSection, sectionIndex: number, itemIndex: number, reason: string): string {
  const item = section.items[itemIndex]
  const label = itemNumber(sectionIndex + 1, itemIndex + 1)
  return item ? `Item ${label} “${item.title}”: ${reason}` : `Item ${label}: ${reason}`
}

/**
 * Traduz as pendencias que a API devolve no `422 TEMPLATE_PUBLISH_INVALID`
 * (`fieldErrors` com caminhos como `sections[1].items` ou
 * `sections[0].items[2].options`, contados a partir de zero na ordem de
 * exibicao) para mensagens de negocio com o alvo no construtor.
 */
export function issuesFromApi(
  fieldErrors: readonly { readonly field: string; readonly message: string }[],
  template: Pick<InspectionTemplateDetail, 'sections'>,
): readonly PublicationIssue[] {
  const sections = sorted(template.sections)

  return fieldErrors.map(({ field, message }) => {
    if (field === 'title') return { message: 'O modelo precisa de um título.', target: { kind: 'template' } }
    if (field === 'category') return { message: 'O modelo precisa de uma categoria.', target: { kind: 'template' } }
    if (field === 'sections') {
      return { message: 'O modelo precisa de ao menos uma seção com um item (RN-015).', target: { kind: 'template' } }
    }

    const match = /^sections\[(\d+)\](?:\.items(?:\[(\d+)\](?:\.(\w+))?)?|\.(\w+))?/.exec(field)
    const sectionIndex = match ? Number(match[1]) : -1
    const section = sections[sectionIndex]
    if (!match || !section) return { message, target: { kind: 'template' } }

    const sectionLabel = `A seção ${sectionIndex + 1} “${section.title}”`
    if (match[2] === undefined) {
      if (field.endsWith('.items')) return { message: `${sectionLabel} não tem itens.`, target: { kind: 'section', id: section.id } }
      return { message: `${sectionLabel} está com a ordem duplicada. Reordene as seções.`, target: { kind: 'section', id: section.id } }
    }

    const itemIndex = Number(match[2])
    const item = section.items[itemIndex]
    const target: IssueTarget = item ? { kind: 'item', id: item.id } : { kind: 'section', id: section.id }
    const reason =
      match[3] === 'responseType'
        ? 'o tipo de resposta não é suportado pelo aplicativo (RN-023).'
        : match[3] === 'displayOrder'
          ? 'a ordem está duplicada. Reordene os itens da seção.'
          : match[3] === 'options'
            ? 'a escolha única precisa de ao menos 2 opções, sem repetir.'
            : match[3] === 'evidenceRequiredOnFailure'
              ? 'observação e evidência na falha só valem para conformidade ou sim/não.'
              : message
    return { message: itemMessage(section, sectionIndex, itemIndex, reason), target }
  })
}
