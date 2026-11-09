import { TEMPLATE_LIMITS } from '@/lib/domain/inspection-template'

/**
 * Validacao do novo modelo, a mesma no navegador e na Server Action.
 *
 * Titulo e categoria sao obrigatorios desde o rascunho (RN-015); os limites de
 * tamanho sao os da API, para o erro aparecer no campo antes do envio.
 */
export type NewTemplateField = 'title' | 'description' | 'category'

export type NewTemplateErrors = Partial<Record<NewTemplateField, string>>

export type NewTemplateValues = Partial<Record<NewTemplateField, string>>

/** Ordem dos campos na tela, para levar o foco ao primeiro invalido. */
export const NEW_TEMPLATE_FIELD_ORDER: readonly NewTemplateField[] = ['title', 'description', 'category']

function clean(value: string | undefined): string {
  return value?.trim() ?? ''
}

export function validateNewTemplate(values: NewTemplateValues): NewTemplateErrors {
  const errors: NewTemplateErrors = {}
  const title = clean(values.title)
  const description = clean(values.description)
  const category = clean(values.category)

  if (title === '') errors.title = 'O título do modelo é obrigatório.'
  else if (title.length > TEMPLATE_LIMITS.title) errors.title = `Use no máximo ${TEMPLATE_LIMITS.title} caracteres.`

  if (description.length > TEMPLATE_LIMITS.description) {
    errors.description = `Use no máximo ${TEMPLATE_LIMITS.description} caracteres.`
  }

  if (category === '') errors.category = 'A categoria do modelo é obrigatória.'
  else if (category.length > TEMPLATE_LIMITS.category) {
    errors.category = `Use no máximo ${TEMPLATE_LIMITS.category} caracteres.`
  }

  return errors
}

export function hasNewTemplateErrors(errors: NewTemplateErrors): boolean {
  return Object.keys(errors).length > 0
}
