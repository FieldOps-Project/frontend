import {
  BUILDER_LIMITS,
  isResponseType,
  MIN_CHOICE_OPTIONS,
  supportsOptions,
} from '@/lib/domain/template-builder'

/**
 * Validacao de secao e item, a mesma no navegador e nas Server Actions.
 *
 * Repete as regras da API (RN-016 e `TemplateItemRules`) para o erro aparecer
 * no campo antes do envio: titulo obrigatorio, limites de tamanho, tipo valido
 * e, na escolha unica, ao menos duas opcoes preenchidas e sem repeticao.
 */
export type SectionErrors = Partial<Record<'title' | 'description', string>>

export type ItemErrors = Partial<Record<'title' | 'description' | 'responseType' | 'options', string>>

function clean(value: string | null | undefined): string {
  return value?.trim() ?? ''
}

export function validateSection(values: { title?: string | null; description?: string | null }): SectionErrors {
  const errors: SectionErrors = {}
  const title = clean(values.title)

  if (title === '') errors.title = 'Dê um título para a seção.'
  else if (title.length > BUILDER_LIMITS.sectionTitle) errors.title = `Use no máximo ${BUILDER_LIMITS.sectionTitle} caracteres.`

  if (clean(values.description).length > BUILDER_LIMITS.sectionDescription) {
    errors.description = `Use no máximo ${BUILDER_LIMITS.sectionDescription} caracteres.`
  }

  return errors
}

export function validateItem(values: {
  title?: string | null
  description?: string | null
  responseType?: string | null
  options?: readonly string[]
}): ItemErrors {
  const errors: ItemErrors = {}
  const title = clean(values.title)
  const type = clean(values.responseType)

  if (title === '') errors.title = 'Escreva a pergunta do item.'
  else if (title.length > BUILDER_LIMITS.itemTitle) errors.title = `Use no máximo ${BUILDER_LIMITS.itemTitle} caracteres.`

  if (clean(values.description).length > BUILDER_LIMITS.itemDescription) {
    errors.description = `Use no máximo ${BUILDER_LIMITS.itemDescription} caracteres.`
  }

  if (!isResponseType(type)) {
    errors.responseType = 'Escolha o tipo de resposta.'
    return errors
  }

  if (supportsOptions(type)) {
    const options = (values.options ?? []).map((option) => option.trim())
    if (options.length < MIN_CHOICE_OPTIONS || options.some((option) => option === '')) {
      errors.options = `Informe ao menos ${MIN_CHOICE_OPTIONS} opções, sem deixar opção em branco.`
    } else if (options.length > BUILDER_LIMITS.options) {
      errors.options = `Use no máximo ${BUILDER_LIMITS.options} opções.`
    } else if (options.some((option) => option.length > BUILDER_LIMITS.option)) {
      errors.options = `Cada opção pode ter no máximo ${BUILDER_LIMITS.option} caracteres.`
    } else if (new Set(options.map((option) => option.toLowerCase())).size !== options.length) {
      errors.options = 'As opções não podem se repetir.'
    }
  }

  return errors
}

export function hasErrors(errors: object): boolean {
  return Object.values(errors).some(Boolean)
}
