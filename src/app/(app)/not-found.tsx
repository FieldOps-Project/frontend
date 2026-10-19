import Link from 'next/link'
import { IoHelpCircleOutline } from 'react-icons/io5'

import { BUTTON_PRIMARY, CARD } from '@/components/ui/styles'

export default function AppNotFound() {
  return (
    <section className={`${CARD} mx-auto flex max-w-lg flex-col items-center gap-4 px-6 py-12 text-center`}>
      <IoHelpCircleOutline aria-hidden className="size-10 text-neutral-300" />
      <h1 className="text-xl font-semibold text-neutral-900">Registro não encontrado</h1>
      <p className="text-sm text-neutral-600">O endereço não existe ou o registro foi removido.</p>
      <Link href="/dashboard" className={BUTTON_PRIMARY}>
        Voltar ao início
      </Link>
    </section>
  )
}
