'use client'

import { IoPrintOutline } from 'react-icons/io5'

import { BUTTON_PRIMARY } from '@/components/ui/styles'

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={BUTTON_PRIMARY}>
      <IoPrintOutline aria-hidden className="size-4" />
      Imprimir
    </button>
  )
}
