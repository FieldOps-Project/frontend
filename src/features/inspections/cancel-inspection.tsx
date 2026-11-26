'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition, type FormEvent } from 'react'
import { IoBanOutline } from 'react-icons/io5'

import { useToast } from '@/components/ui/toast'
import { cancelInspection } from '@/features/inspections/detail-actions'
import { CANCEL_REASON_MAX_LENGTH } from '@/lib/domain/inspection-detail'

const OPEN_BUTTON =
  'inline-flex h-11 items-center gap-2 rounded-field border-2 border-danger bg-neutral-0 px-5 text-base font-semibold text-danger transition-colors hover:bg-danger-soft'

const CONFIRM_BUTTON =
  'inline-flex h-10 items-center rounded-field bg-danger px-4 text-sm font-semibold text-neutral-0 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'

const TEXTAREA =
  'w-full rounded-field border border-input-border bg-input px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100'

export function CancelInspection({ inspectionId, reference }: { inspectionId: string; reference: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [pending, startTransition] = useTransition()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const notify = useToast()
  const router = useRouter()
  const filled = reason.trim() !== ''

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!filled) return

    startTransition(async () => {
      const result = await cancelInspection(inspectionId, reason)
      notify(result.message, result.ok ? 'success' : 'error')
      if (result.ok) {
        setOpen(false)
        setReason('')
        router.refresh()
      }
    })
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={OPEN_BUTTON}>
        <IoBanOutline aria-hidden className="size-5" />
        Cancelar inspeção
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        aria-labelledby="cancel-inspection-title"
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-card border border-neutral-200 bg-surface-overlay p-0 shadow-overlay backdrop:bg-blanket"
      >
        {open && (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 p-6">
            <div className="flex flex-col gap-1">
              <h2 id="cancel-inspection-title" className="text-lg font-semibold text-neutral-900">
                Cancelar {reference}
              </h2>
              <p className="text-sm text-neutral-600">
                A inspeção sai da agenda do técnico na próxima sincronização. Seu nome, o horário e o motivo ficam
                registrados no histórico, e o cancelamento não pode ser desfeito.
              </p>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-neutral-900">
                Motivo do cancelamento <span className="text-danger">*</span>
              </span>
              <textarea
                name="reason"
                rows={4}
                required
                autoFocus
                maxLength={CANCEL_REASON_MAX_LENGTH}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Ex.: cliente pediu reagendamento porque a área está interditada."
                aria-describedby="cancel-reason-hint"
                className={TEXTAREA}
              />
              <span id="cancel-reason-hint" className="text-xs text-neutral-500">
                {filled ? `${reason.length}/${CANCEL_REASON_MAX_LENGTH} caracteres` : 'Obrigatório para confirmar.'}
              </span>
            </label>

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-10 rounded-field border border-neutral-200 px-4 text-sm text-neutral-700 hover:bg-neutral-100"
              >
                Voltar
              </button>
              <button type="submit" disabled={!filled || pending} className={CONFIRM_BUTTON}>
                {pending ? 'Cancelando…' : 'Confirmar cancelamento'}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  )
}
