import Link from 'next/link'
import { MdAddCircleOutline, MdOutlineFactCheck } from 'react-icons/md'

import { DASHBOARD_CARD } from '@/features/dashboard/styles'

/**
 * Operacao que ainda nao tem nenhuma inspecao: em vez de oito zeros sem
 * contexto (issue #28), o painel diz o que falta e oferece o primeiro passo.
 */
export function EmptyOperation() {
  return (
    <section aria-labelledby="empty-operation-title" className={`${DASHBOARD_CARD} flex flex-col items-center gap-3 px-6 py-14 text-center`}>
      <span className="grid size-12 place-items-center rounded-full bg-brand-50 text-brand-700">
        <MdOutlineFactCheck aria-hidden className="size-7" />
      </span>
      <h2 id="empty-operation-title" className="text-lg font-semibold text-neutral-950">
        Nenhuma inspeção agendada ainda
      </h2>
      <p className="max-w-md text-sm text-neutral-600">
        Os indicadores aparecem aqui assim que a primeira inspeção for criada e atribuída a um técnico.
      </p>
      <Link
        href="/inspections/new"
        className="mt-2 inline-flex h-11 items-center gap-2.5 rounded-md bg-brand-700 px-5 text-[15px] font-medium text-neutral-0 transition-colors hover:bg-brand-800"
      >
        <MdAddCircleOutline aria-hidden className="size-5" />
        Criar Inspeção
      </Link>
    </section>
  )
}
