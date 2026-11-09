import Link from 'next/link'
import { MdAddCircleOutline, MdOutlineChecklistRtl } from 'react-icons/md'

const OUTLINE =
  'inline-flex h-11 items-center justify-center gap-2.5 rounded-md border border-neutral-300 bg-neutral-0 px-5 text-[15px] font-medium text-neutral-900 transition-colors hover:bg-neutral-100'

const PRIMARY =
  'inline-flex h-11 items-center justify-center gap-2.5 rounded-md bg-brand-700 px-5 text-[15px] font-medium text-neutral-0 transition-colors hover:bg-brand-800'

/**
 * Titulo do dashboard com os atalhos do documento 14.5: revisar pendencias
 * (a listagem ja filtrada por "aguardando revisao") e criar inspecao.
 */
export function DashboardHeader() {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex min-w-0 flex-col gap-2">
        <h1 className="text-[28px] leading-tight font-semibold tracking-tight text-neutral-950 sm:text-[32px]">
          Visão Geral do Painel
        </h1>
        <p className="text-base text-neutral-700 sm:text-[17px]">
          Acompanhe o status da operação, os indicadores de conformidade e as ações pendentes.
        </p>
      </div>

      <div className="grid shrink-0 grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:flex">
        <Link href="/inspections?review=1" className={OUTLINE}>
          <MdOutlineChecklistRtl aria-hidden className="size-5" />
          Revisar Pendências
        </Link>
        <Link href="/inspections/new" className={PRIMARY}>
          <MdAddCircleOutline aria-hidden className="size-5" />
          Criar Inspeção
        </Link>
      </div>
    </header>
  )
}
