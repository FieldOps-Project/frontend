'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition, type FormEvent } from 'react'
import { IoCheckmarkCircleOutline, IoCloseCircleOutline } from 'react-icons/io5'

import { useToast } from '@/components/ui/toast'
import { approveInspection, rejectInspection } from '@/features/inspections/review-actions'

type CorrectableItem = { readonly id: string; readonly code: string; readonly title: string }

type Mode = 'approve' | 'reject' | null

const REJECT_BUTTON =
  'inline-flex h-11 items-center gap-2 rounded-field border-2 border-danger bg-neutral-0 px-5 text-base font-semibold text-danger transition-colors hover:bg-danger-soft disabled:cursor-wait disabled:opacity-70'

const APPROVE_BUTTON =
  'inline-flex h-11 items-center gap-2 rounded-field bg-success px-5 text-base font-semibold text-neutral-0 transition-colors hover:brightness-95 disabled:cursor-wait disabled:opacity-70'

const TEXTAREA =
  'w-full rounded-field border border-neutral-200 bg-neutral-0 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100 aria-[invalid=true]:border-danger'

/**
 * Aprovar e reprovar (documento 14.11 e AC-REVIEW).
 *
 * As duas decisoes passam por um dialogo de confirmacao. Reprovar exige motivo
 * (RN-080) -- sem ele o botao de confirmar nao envia -- e permite marcar os
 * itens que voltam ao tecnico; as nao conformidades ja vem marcadas. Aprovar
 * aceita um comentario opcional (RN-081) e avisa que as respostas ficam
 * protegidas contra edicao (RN-082).
 */
export function ReviewDecision({
  inspectionId,
  correctableItems,
  suggestedItemIds,
}: {
  inspectionId: string
  correctableItems: readonly CorrectableItem[]
  suggestedItemIds: readonly string[]
}) {
  const [mode, setMode] = useState<Mode>(null)
  const [reasonError, setReasonError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const notify = useToast()
  const router = useRouter()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (mode && !dialog.open) dialog.showModal()
    if (!mode && dialog.open) dialog.close()
  }, [mode])

  function open(next: Exclude<Mode, null>) {
    setReasonError(null)
    setMode(next)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)

    if (mode === 'reject') {
      const reason = String(data.get('reason') ?? '').trim()
      if (reason === '') {
        setReasonError('Informe o motivo da reprovação.')
        event.currentTarget.querySelector<HTMLTextAreaElement>('[name="reason"]')?.focus()
        return
      }
    }

    startTransition(async () => {
      const result =
        mode === 'reject'
          ? await rejectInspection(inspectionId, String(data.get('reason')), data.getAll('items').map(String))
          : await approveInspection(inspectionId, String(data.get('comments') ?? ''))

      notify(result.message, result.ok ? 'success' : 'error')
      if (result.ok) {
        setMode(null)
        router.refresh()
      }
    })
  }

  return (
    <>
      <div className="flex shrink-0 flex-wrap gap-3">
        <button type="button" onClick={() => open('reject')} className={REJECT_BUTTON}>
          <IoCloseCircleOutline aria-hidden className="size-6" />
          Reprovar
        </button>
        <button type="button" onClick={() => open('approve')} className={APPROVE_BUTTON}>
          <IoCheckmarkCircleOutline aria-hidden className="size-6" />
          Aprovar
        </button>
      </div>

      <dialog
        ref={dialogRef}
        onClose={() => setMode(null)}
        aria-labelledby="review-decision-title"
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-card border border-neutral-200 bg-neutral-0 p-0 shadow-xl backdrop:bg-neutral-950/40"
      >
        {mode && (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 p-6">
            <div className="flex flex-col gap-1">
              <h2 id="review-decision-title" className="text-lg font-semibold text-neutral-900">
                {mode === 'reject' ? 'Reprovar inspeção' : 'Aprovar inspeção'}
              </h2>
              <p className="text-sm text-neutral-600">
                {mode === 'reject'
                  ? 'A inspeção volta ao técnico para correção. O histórico das respostas atuais é preservado.'
                  : 'Seu nome e o horário da aprovação serão registrados, e as respostas ficarão protegidas contra edição.'}
              </p>
            </div>

            {mode === 'reject' ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="review-reason" className="text-sm font-medium text-neutral-700">
                    Motivo da reprovação
                    <span aria-hidden className="text-danger">
                      {' '}
                      *
                    </span>
                  </label>
                  <textarea
                    id="review-reason"
                    name="reason"
                    rows={4}
                    maxLength={1000}
                    required
                    aria-invalid={Boolean(reasonError)}
                    aria-describedby={reasonError ? 'review-reason-error' : undefined}
                    onChange={() => setReasonError(null)}
                    placeholder="Explique o que precisa ser corrigido."
                    className={TEXTAREA}
                  />
                  {reasonError && (
                    <p id="review-reason-error" className="text-xs text-danger">
                      {reasonError}
                    </p>
                  )}
                </div>

                {correctableItems.length > 0 && (
                  <fieldset className="flex flex-col gap-2">
                    <legend className="mb-1 text-sm font-medium text-neutral-700">Itens a corrigir</legend>
                    <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto">
                      {correctableItems.map((item) => (
                        <label key={item.id} className="flex items-start gap-2 text-sm text-neutral-800">
                          <input
                            type="checkbox"
                            name="items"
                            value={item.id}
                            defaultChecked={suggestedItemIds.includes(item.id)}
                            className="mt-0.5 size-4 accent-brand-600"
                          />
                          <span>
                            <span className="font-medium">{item.code}</span> {item.title}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}
              </>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="review-comments" className="text-sm font-medium text-neutral-700">
                  Comentário (opcional)
                </label>
                <textarea id="review-comments" name="comments" rows={3} maxLength={1000} className={TEXTAREA} />
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-neutral-200 pt-4">
              <button
                type="button"
                onClick={() => setMode(null)}
                className="rounded-field border border-neutral-200 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={pending}
                className={`rounded-field px-3 py-2 text-sm font-semibold text-neutral-0 disabled:cursor-wait disabled:opacity-70 ${
                  mode === 'reject' ? 'bg-danger hover:brightness-95' : 'bg-success hover:brightness-95'
                }`}
              >
                {pending ? 'Enviando…' : mode === 'reject' ? 'Confirmar reprovação' : 'Confirmar aprovação'}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  )
}
