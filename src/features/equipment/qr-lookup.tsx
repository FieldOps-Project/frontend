'use client'

import { useActionState } from 'react'
import { IoQrCodeOutline } from 'react-icons/io5'

import { BUTTON_SECONDARY, INPUT } from '@/components/ui/styles'
import { findEquipmentByQr, type QrLookupState } from '@/features/equipment/actions'

const INITIAL: QrLookupState = {}

export function QrLookup() {
  const [state, action, pending] = useActionState(findEquipmentByQr, INITIAL)

  return (
    <form action={action} className="flex flex-col gap-1.5">
      <label htmlFor="qr-lookup" className="text-xs font-medium text-neutral-500">
        Abrir pelo QR Code
      </label>
      <div className="flex gap-2">
        <input
          id="qr-lookup"
          name="qrCode"
          defaultValue={state.code}
          placeholder="EQP-…"
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? 'qr-lookup-error' : undefined}
          className={`${INPUT} w-56 font-mono`}
        />
        <button type="submit" disabled={pending} className={BUTTON_SECONDARY}>
          <IoQrCodeOutline aria-hidden className="size-4" />
          {pending ? 'Buscando…' : 'Abrir'}
        </button>
      </div>
      {state.error && (
        <p id="qr-lookup-error" role="alert" className="text-xs text-danger">
          {state.error}
        </p>
      )}
    </form>
  )
}
