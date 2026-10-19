import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

import { INPUT } from '@/components/ui/styles'

type FieldFrameProps = {
  readonly name: string
  readonly label: string
  readonly error?: string
  readonly hint?: string
  readonly required?: boolean
  readonly className?: string
  readonly children: (aria: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode
}

/**
 * Moldura de campo: rotulo associado, texto de ajuda e erro ligados por
 * `aria-describedby`. E o que faz o leitor de tela anunciar "Este e-mail ja
 * esta cadastrado" ao entrar no campo, e nao so quem enxerga o vermelho.
 */
function FieldFrame({ name, label, error, hint, required, className = '', children }: FieldFrameProps) {
  const id = `field-${name}`
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-neutral-700">
        {label}
        {required && (
          <span aria-hidden className="text-danger">
            {' '}
            *
          </span>
        )}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {error && (
        <p id={errorId} className="text-xs text-danger">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="text-xs text-neutral-500">
          {hint}
        </p>
      )}
    </div>
  )
}

type BaseProps = {
  readonly name: string
  readonly label: string
  readonly error?: string
  readonly hint?: string
  readonly className?: string
}

export function TextField({
  name,
  label,
  error,
  hint,
  className,
  ...input
}: BaseProps & Omit<InputHTMLAttributes<HTMLInputElement>, 'name' | 'id'>) {
  return (
    <FieldFrame name={name} label={label} error={error} hint={hint} required={input.required} className={className}>
      {({ id, describedBy, invalid }) => (
        <input
          id={id}
          name={name}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={INPUT}
          {...input}
        />
      )}
    </FieldFrame>
  )
}

export function TextAreaField({
  name,
  label,
  error,
  hint,
  className,
  ...textarea
}: BaseProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'name' | 'id'>) {
  return (
    <FieldFrame name={name} label={label} error={error} hint={hint} required={textarea.required} className={className}>
      {({ id, describedBy, invalid }) => (
        <textarea
          id={id}
          name={name}
          rows={3}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={INPUT}
          {...textarea}
        />
      )}
    </FieldFrame>
  )
}

export type SelectOption = { readonly value: string; readonly label: string }
export type SelectGroup = { readonly label: string; readonly options: readonly SelectOption[] }

export function SelectField({
  name,
  label,
  error,
  hint,
  className,
  options,
  groups,
  placeholder,
  ...select
}: BaseProps & {
  readonly options?: readonly SelectOption[]
  readonly groups?: readonly SelectGroup[]
  readonly placeholder?: string
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'name' | 'id'>) {
  return (
    <FieldFrame name={name} label={label} error={error} hint={hint} required={select.required} className={className}>
      {({ id, describedBy, invalid }) => (
        <select id={id} name={name} aria-invalid={invalid} aria-describedby={describedBy} className={INPUT} {...select}>
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          {groups?.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      )}
    </FieldFrame>
  )
}

/** Bloco de formulario com titulo, em grade de duas colunas a partir de telas medias. */
export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-1 flex flex-col gap-0.5">
        <span className="text-base font-semibold text-neutral-900">{title}</span>
        {description && <span className="text-sm text-neutral-500">{description}</span>}
      </legend>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </fieldset>
  )
}
