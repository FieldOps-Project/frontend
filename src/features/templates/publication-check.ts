import { validateItem } from '@/features/templates/builder-validation'
import { itemNumber, type InspectionTemplateDetail } from '@/lib/domain/template-builder'
import type { PublicationIssue } from '@/lib/domain/template-publication'

/**
 * Conferencia local antes de publicar, com as regras do backend
 * (`TemplatePublicationValidator`): titulo e categoria (RN-015), ao menos uma
 * secao, item em toda secao e cada item valido para o tipo (RN-016).
 *
 * Antecipa a resposta para a pessoa corrigir tudo de uma vez; quem decide e o
 * endpoint de publicacao, cujas pendencias substituem estas quando divergirem.
 */
export function publicationIssues(
  template: Pick<InspectionTemplateDetail, 'title' | 'category' | 'sections'>,
): readonly PublicationIssue[] {
  const issues: PublicationIssue[] = []

  if (template.title.trim() === '') issues.push({ message: 'O modelo precisa de um título.', target: { kind: 'template' } })
  if (template.category.trim() === '') issues.push({ message: 'O modelo precisa de uma categoria.', target: { kind: 'template' } })

  const sections = template.sections.toSorted((a, b) => a.displayOrder - b.displayOrder)
  if (sections.length === 0) {
    issues.push({ message: 'O modelo precisa de ao menos uma seção com um item (RN-015).', target: { kind: 'template' } })
  }

  sections.forEach((section, sectionIndex) => {
    if (section.items.length === 0) {
      issues.push({
        message: `A seção ${sectionIndex + 1} “${section.title}” não tem itens.`,
        target: { kind: 'section', id: section.id },
      })
    }

    section.items
      .toSorted((a, b) => a.displayOrder - b.displayOrder)
      .forEach((item, itemIndex) => {
        const errors = validateItem(item)
        const reason = errors.title ?? errors.responseType ?? errors.options ?? errors.description
        if (reason) {
          issues.push({
            message: `Item ${itemNumber(sectionIndex + 1, itemIndex + 1)} “${item.title}”: ${reason}`,
            target: { kind: 'item', id: item.id },
          })
        }
      })
  })

  return issues
}
