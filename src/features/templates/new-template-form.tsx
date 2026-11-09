'use client'

import Link from 'next/link'
import { useActionState, useEffect, useRef, useState, type FormEvent } from 'react'

import { FormAlert, SubmitButton } from '@/components/ui/form-actions'
import { TextAreaField, TextField } from '@/components/ui/form-fields'
import { createTemplate } from '@/features/templates/actions'
import {
  firstInvalidNewTemplateField,
  hasNewTemplateErrors,
  validateNewTemplate,
  type NewTemplateErrors,
  type NewTemplateField,
} from '@/features/templates/new-template-validation'
import { TEMPLATE_LIMITS } from '@/lib/domain/inspection-template'
import { errorOf, IDLE, valueOf } from '@/lib/form-state'

const SUBMIT =
  'inline-flex h-11 items-center justify-center gap-2 rounded-field bg-brand-700 px-5 text-sm font-semibold text-neutral-0 transition-colors hover:bg-brand-800 disabled:cursor-wait disabled:opacity-70'

/**
 * Novo modelo em rascunho (issue #13): titulo, descricao e categoria.
 *
 * Valida no navegador com as mesmas regras da Server Action e leva o foco ao
 * primeiro campo invalido. A categoria e texto livre na API; as ja usadas
 * aparecem como sugestao, para "Equipamentos" nao virar "equipamento" num
 * cadastro e "Equipamentos " no outro.
 */
export function NewTemplateForm({ categories }: { categories: readonly string[] }) {
  const [state, action] = useActionState(createTemplate, IDLE)
  const [clientErrors, setClientErrors] = useState<NewTemplateErrors | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function errorFor(field: NewTemplateField): string | undefined {
    return clientErrors ? clientErrors[field] : errorOf(state, field)
  }

  function clearError(field: NewTemplateField) {
    if (clientErrors?.[field]) setClientErrors({ ...clientErrors, [field]: undefined })
  }

  function focusField(field: NewTemplateField) {
    formRef.current?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus()
  }

  useEffect(() => {
    if (state.status !== 'error') return
    const invalid = firstInvalidNewTemplateField(state.fieldErrors as NewTemplateErrors)
    if (invalid) focusField(invalid)
  }, [state])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget)
    const found = validateNewTemplate({
      title: String(data.get('title') ?? ''),
      description: String(data.get('description') ?? ''),
      category: String(data.get('category') ?? ''),
    })

    if (hasNewTemplateErrors(found)) {
      event.preventDefault()
      setClientErrors(found)
      const invalid = firstInvalidNewTemplateField(found)
      if (invalid) focusField(invalid)
      return
    }
    setClientErrors(null)
  }

  return (
    <form ref={formRef} action={action} onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {!clientErrors && <FormAlert state={state} />}

      <TextField
        name="title"
        label="Título do modelo"
        required
        maxLength={TEMPLATE_LIMITS.title}
        placeholder="Ex.: Inspeção de Máquinas Pesadas"
        defaultValue={valueOf(state, 'title', '')}
        onChange={() => clearError('title')}
        error={errorFor('title')}
      />

      <TextAreaField
        name="description"
        label="Descrição"
        labelNote="(opcional)"
        rows={4}
        maxLength={TEMPLATE_LIMITS.description}
        placeholder="Para que serve este checklist e onde ele é aplicado."
        defaultValue={valueOf(state, 'description', '')}
        onChange={() => clearError('description')}
        error={errorFor('description')}
      />

      <TextField
        name="category"
        label="Categoria"
        required
        list="template-categories"
        autoComplete="off"
        maxLength={TEMPLATE_LIMITS.category}
        placeholder="Ex.: Equipamentos"
        hint={categories.length > 0 ? 'Escolha uma categoria existente ou digite uma nova.' : undefined}
        defaultValue={valueOf(state, 'category', '')}
        onChange={() => clearError('category')}
        error={errorFor('category')}
      />
      <datalist id="template-categories">
        {categories.map((category) => (
          <option key={category} value={category} />
        ))}
      </datalist>

      <div className="flex flex-wrap items-center justify-end gap-6 border-t border-neutral-200 pt-6">
        <Link href="/inspection-templates" className="text-sm font-medium text-brand-700 hover:text-brand-800 hover:underline">
          Cancelar
        </Link>
        <SubmitButton pendingLabel="Criando…" className={SUBMIT}>
          Criar rascunho
        </SubmitButton>
      </div>
    </form>
  )
}
