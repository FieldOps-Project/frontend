/**
 * Leitura de `FormData` nas Server Actions.
 *
 * Campo opcional vazio vira `null`, e nao string vazia: a API distingue
 * "nao informado" de "informado em branco", e um `""` em `legalName` ficaria
 * gravado como razao social vazia.
 */
export function text(formData: FormData, field: string): string | null {
  const value = formData.get(field)

  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export function number(formData: FormData, field: string): number | null {
  const value = text(formData, field)

  if (value === null) {
    return null
  }

  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

/** O que a pessoa digitou, para devolver ao formulario em caso de erro. Senhas ficam de fora. */
export function submittedValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {}

  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string' && !key.startsWith('$') && !/password/i.test(key)) {
      values[key] = value
    }
  }

  return values
}
