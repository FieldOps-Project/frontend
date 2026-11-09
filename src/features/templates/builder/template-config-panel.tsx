'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'

import { FormAlert, SubmitButton } from '@/components/ui/form-actions'
import { TextAreaField, TextField } from '@/components/ui/form-fields'
import { useToast } from '@/components/ui/toast'
import { updateTemplateInfo } from '@/features/templates/builder-actions'
import type { InspectionTemplate } from '@/lib/domain/inspection-template'
import { TEMPLATE_LIMITS } from '@/lib/domain/inspection-template'
import { errorOf, IDLE, valueOf } from '@/lib/form-state'

const SAVE =
  'inline-flex h-10 items-center justify-center gap-2 rounded-md border border-neutral-300 bg-neutral-0 px-4 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-100 disabled:cursor-wait disabled:opacity-70'

/**
 * "Configuração do Modelo" do desenho do construtor: titulo, descricao e
 * categoria do modelo, salvos juntos. O selo diz o que esta sendo editado: o
 * rascunho, que so vira versao ao publicar.
 */
export function TemplateConfigPanel({
  template,
  categories,
}: {
  template: Pick<InspectionTemplate, 'id' | 'title' | 'description' | 'category'>
  categories: readonly string[]
}) {
  const [state, action] = useActionState(updateTemplateInfo.bind(null, template.id), IDLE)
  const notify = useToast()
  const router = useRouter()

  useEffect(() => {
    if (state.status === 'success') {
      notify(state.message, 'success')
      router.refresh()
    }
  }, [state, notify, router])

  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-neutral-950">Configuração do Modelo</h2>
        <span className="rounded-md bg-neutral-100 px-2.5 py-0.5 text-sm font-medium text-neutral-700">Rascunho</span>
      </div>

      <FormAlert state={state} />

      <TextField
        name="title"
        label="Título do Modelo"
        required
        maxLength={TEMPLATE_LIMITS.title}
        defaultValue={valueOf(state, 'title', template.title)}
        error={errorOf(state, 'title')}
      />

      <TextAreaField
        name="description"
        label="Descrição"
        rows={4}
        maxLength={TEMPLATE_LIMITS.description}
        defaultValue={valueOf(state, 'description', template.description)}
        error={errorOf(state, 'description')}
      />

      <TextField
        name="category"
        label="Categoria"
        required
        list="builder-categories"
        autoComplete="off"
        maxLength={TEMPLATE_LIMITS.category}
        defaultValue={valueOf(state, 'category', template.category)}
        error={errorOf(state, 'category')}
      />
      <datalist id="builder-categories">
        {categories.map((category) => (
          <option key={category} value={category} />
        ))}
      </datalist>

      <div className="flex justify-end">
        <SubmitButton pendingLabel="Salvando…" className={SAVE}>
          Salvar dados do modelo
        </SubmitButton>
      </div>
    </form>
  )
}
