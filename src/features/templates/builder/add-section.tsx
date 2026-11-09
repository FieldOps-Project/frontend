'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition, type FormEvent } from 'react'
import { MdAddCircleOutline } from 'react-icons/md'

import { useToast } from '@/components/ui/toast'
import { createSection } from '@/features/templates/builder-actions'
import { validateSection } from '@/features/templates/builder-validation'
import { BUILDER_LIMITS } from '@/lib/domain/template-builder'

/**
 * "Adicionar Nova Seção" do desenho do construtor: a caixa tracejada vira o
 * campo do titulo; Enter salva, Esc desiste. A secao entra no fim do rascunho.
 */
export function AddSection({ templateId }: { templateId: string }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const notify = useToast()
  const router = useRouter()

  function close() {
    setOpen(false)
    setError(null)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = inputRef.current?.value ?? ''
    const found = validateSection({ title })
    if (found.title) {
      setError(found.title)
      inputRef.current?.focus()
      return
    }

    startTransition(async () => {
      const result = await createSection(templateId, { title })
      if (!result.ok) {
        setError(result.fieldErrors.title ?? result.message)
        return
      }
      notify(result.message, 'success')
      close()
      router.refresh()
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-neutral-300 px-6 py-10 text-neutral-700 transition-colors hover:border-brand-300 hover:bg-brand-50/40 hover:text-brand-700"
      >
        <MdAddCircleOutline aria-hidden className="size-9" />
        <span className="text-lg font-medium">Adicionar Nova Seção</span>
      </button>
    )
  }

  return (
    <form
      onSubmit={submit}
      onKeyDown={(event) => {
        if (event.key === 'Escape') close()
      }}
      noValidate
      className="flex flex-col gap-3 rounded-lg border-2 border-dashed border-brand-300 bg-neutral-0 p-5 sm:p-6"
    >
      <label htmlFor="new-section-title" className="text-sm font-medium text-neutral-800">
        Título da nova seção
      </label>
      <input
        ref={inputRef}
        id="new-section-title"
        autoFocus
        maxLength={BUILDER_LIMITS.sectionTitle}
        placeholder="Ex.: Sistema elétrico"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'new-section-error' : undefined}
        onChange={() => setError(null)}
        className="h-11 rounded-md border border-neutral-300 px-3 text-[15px] text-neutral-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 aria-[invalid=true]:border-danger"
      />
      {error && (
        <p id="new-section-error" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex items-center justify-end gap-5">
        <button type="button" onClick={close} className="text-sm font-medium text-neutral-700 hover:text-neutral-950">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center rounded-md bg-brand-700 px-4 text-sm font-semibold text-neutral-0 transition-colors hover:bg-brand-800 disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? 'Adicionando…' : 'Adicionar seção'}
        </button>
      </div>
    </form>
  )
}
