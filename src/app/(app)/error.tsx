'use client'

import { IoCloudOfflineOutline } from 'react-icons/io5'

import { BUTTON_PRIMARY, CARD } from '@/components/ui/styles'

/**
 * Erro de rede ou interno durante a renderizacao. A mensagem e de negocio; o
 * detalhe tecnico fica no log do servidor, nao na tela.
 */
export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className={`${CARD} mx-auto flex max-w-lg flex-col items-center gap-4 px-6 py-12 text-center`}>
      <IoCloudOfflineOutline aria-hidden className="size-10 text-neutral-300" />
      <h1 className="text-xl font-semibold text-neutral-900">Não foi possível carregar esta tela</h1>
      <p className="text-sm text-neutral-600">
        A API não respondeu como esperado. Verifique se ela está no ar e tente novamente.
      </p>
      <button type="button" onClick={reset} className={BUTTON_PRIMARY}>
        Tentar novamente
      </button>
    </section>
  )
}
