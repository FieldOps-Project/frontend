'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { MdDragIndicator } from 'react-icons/md'

import { useConfirm } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast'
import { createItem, updateItem } from '@/features/templates/builder-actions'
import { Switch } from '@/features/templates/builder/switch'
import { AnswerPreview, OptionsEditor } from '@/features/templates/builder/type-settings'
import { hasErrors, validateItem, type ItemErrors } from '@/features/templates/builder-validation'
import {
  BUILDER_LIMITS,
  failureLabel,
  RESPONSE_TYPE_LABELS,
  RESPONSE_TYPES,
  settingsLostOnTypeChange,
  supportsFailureRules,
  supportsOptions,
  type ItemInput,
  type ResponseType,
  type TemplateItem,
} from '@/lib/domain/template-builder'

const FIELD =
  'h-11 min-w-0 rounded-md border border-neutral-300 bg-neutral-0 px-3 text-[15px] text-neutral-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 aria-[invalid=true]:border-danger'

function initialInput(item: TemplateItem | undefined): ItemInput {
  return {
    title: item?.title ?? '',
    description: item?.description ?? null,
    responseType: item?.responseType ?? 'CONFORMITY',
    required: item?.required ?? true,
    observationRequiredOnFailure: item?.observationRequiredOnFailure ?? false,
    evidenceRequiredOnFailure: item?.evidenceRequiredOnFailure ?? false,
    options: item?.options ?? [],
  }
}

/**
 * Item em edicao, como o 1.2 do desenho do construtor: pergunta, tipo de
 * resposta, instrucao adicional e regras, com "Cancelar" e "Salvar Item".
 *
 * Valida no navegador com as regras da API e salva so este item; o aviso de
 * sucesso confirma que a alteracao foi persistida (issue #14).
 */
export function ItemEditor({
  templateId,
  sectionId,
  number,
  item,
  onDone,
}: {
  templateId: string
  sectionId: string
  /** Numero de apresentacao, como `1.2`. */
  number: string
  /** Ausente quando o item e novo. */
  item?: TemplateItem
  onDone: (saved: boolean) => void
}) {
  const [input, setInput] = useState<ItemInput>(() => initialInput(item))
  const [errors, setErrors] = useState<ItemErrors>({})
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const notify = useToast()
  const ask = useConfirm()
  const prefix = `item-${item?.id ?? `new-${sectionId}`}`

  function change(patch: Partial<ItemInput>) {
    setInput((current) => ({ ...current, ...patch }))
    setErrors((current) => {
      const next = { ...current }
      for (const key of Object.keys(patch)) delete next[key as keyof ItemErrors]
      if ('responseType' in patch) delete next.options
      return next
    })
    setMessage(null)
  }

  /**
   * Trocar para um tipo que nao aceita a configuracao ja feita avisa antes o
   * que sera descartado (issue #14), e so entao limpa.
   */
  async function changeType(next: ResponseType) {
    const lost = settingsLostOnTypeChange(input, next)
    if (lost.length > 0) {
      const confirmed = await ask({
        title: 'Trocar o tipo de resposta?',
        description: `Ao trocar para ${RESPONSE_TYPE_LABELS[next]}, ${lost.join(' e ')} serão descartadas.`,
        confirmLabel: 'Trocar tipo',
      })
      if (!confirmed) return
    }

    change({
      responseType: next,
      options: supportsOptions(next) ? input.options : [],
      observationRequiredOnFailure: supportsFailureRules(next) && input.observationRequiredOnFailure,
      evidenceRequiredOnFailure: supportsFailureRules(next) && input.evidenceRequiredOnFailure,
    })
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const found = validateItem(input)
    if (hasErrors(found)) {
      setErrors(found)
      document.getElementById(`${prefix}-${found.title ? 'title' : found.responseType ? 'type' : 'options'}`)?.focus()
      return
    }

    startTransition(async () => {
      const result = item
        ? await updateItem(templateId, item.id, input)
        : await createItem(templateId, sectionId, input)
      if (!result.ok) {
        setErrors(result.fieldErrors as ItemErrors)
        setMessage(result.message)
        return
      }
      notify(result.message, 'success')
      onDone(true)
    })
  }

  return (
    <form
      onSubmit={submit}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onDone(false)
      }}
      noValidate
      aria-label={item ? `Editar o item ${number}` : 'Novo item'}
      className="m-2 flex flex-col gap-4 rounded-lg border-2 border-brand-700 bg-neutral-0 p-4 sm:m-3 sm:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <MdDragIndicator aria-hidden className="size-5 shrink-0 text-neutral-300" />
          <span className="shrink-0 font-medium text-brand-700 tabular-nums">{number}</span>
          <label htmlFor={`${prefix}-title`} className="sr-only">
            Pergunta do item
          </label>
          <input
            id={`${prefix}-title`}
            autoFocus
            value={input.title}
            maxLength={BUILDER_LIMITS.itemTitle}
            placeholder="Escreva a pergunta"
            aria-invalid={errors.title ? true : undefined}
            onChange={(event) => change({ title: event.target.value })}
            className={`${FIELD} w-full flex-1`}
          />
        </div>
        <label htmlFor={`${prefix}-type`} className="sr-only">
          Tipo de resposta
        </label>
        <select
          id={`${prefix}-type`}
          value={input.responseType}
          aria-invalid={errors.responseType ? true : undefined}
          onChange={(event) => void changeType(event.target.value as ResponseType)}
          className={`${FIELD} sm:w-60`}
        >
          {RESPONSE_TYPES.map((type) => (
            <option key={type} value={type}>
              {RESPONSE_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      {errors.title && <p className="-mt-2 text-sm text-danger sm:pl-14">{errors.title}</p>}

      <div className="sm:pl-14">
        <label htmlFor={`${prefix}-description`} className="sr-only">
          Instrução adicional (opcional)
        </label>
        <input
          id={`${prefix}-description`}
          value={input.description ?? ''}
          maxLength={BUILDER_LIMITS.itemDescription}
          placeholder="Instrução adicional (opcional)..."
          onChange={(event) => change({ description: event.target.value })}
          className="w-full bg-transparent py-1 text-sm text-neutral-700 italic outline-none placeholder:text-neutral-500 focus-visible:not-italic"
        />
        {errors.description && <p className="text-sm text-danger">{errors.description}</p>}
      </div>

      <div className="rounded-md border border-neutral-200 bg-neutral-100 p-4 sm:ml-14">
        {supportsOptions(input.responseType) ? (
          <OptionsEditor
            idPrefix={prefix}
            options={input.options}
            error={errors.options}
            onChange={(options) => change({ options })}
          />
        ) : (
          <AnswerPreview type={input.responseType} />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-neutral-200 pt-4 sm:ml-14">
        <Switch label="Obrigatório" checked={input.required} onChange={(required) => change({ required })} />
        {supportsFailureRules(input.responseType) && (
          <>
            <Switch
              label={`Exigir Observação (${failureLabel(input.responseType)})`}
              checked={input.observationRequiredOnFailure}
              onChange={(observationRequiredOnFailure) => change({ observationRequiredOnFailure })}
            />
            <Switch
              label="Exigir Evidência (Foto)"
              marker={input.evidenceRequiredOnFailure ? '!' : undefined}
              checked={input.evidenceRequiredOnFailure}
              onChange={(evidenceRequiredOnFailure) => change({ evidenceRequiredOnFailure })}
            />
          </>
        )}
      </div>

      {message && (
        <p role="alert" className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
          {message}
        </p>
      )}

      <div className="flex items-center justify-end gap-6">
        <button type="button" onClick={() => onDone(false)} className="text-sm font-medium text-neutral-800 hover:text-neutral-950">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center rounded-md bg-brand-700 px-5 text-sm font-semibold text-neutral-0 transition-colors hover:bg-brand-800 disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? 'Salvando…' : 'Salvar Item'}
        </button>
      </div>
    </form>
  )
}
