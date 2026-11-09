const BLOCK = 'animate-pulse rounded-md bg-neutral-200/70'

/**
 * Esqueleto do dashboard com a mesma grade da tela pronta: a pagina nao pula
 * de lugar quando os numeros chegam.
 */
export default function DashboardLoading() {
  return (
    <div role="status" aria-label="Carregando o painel" className="flex flex-col gap-6 lg:gap-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-3">
          <span className={`${BLOCK} h-8 w-72 max-w-full`} />
          <span className={`${BLOCK} h-5 w-[28rem] max-w-full`} />
        </div>
        <div className="flex gap-3">
          <span className={`${BLOCK} h-11 w-44`} />
          <span className={`${BLOCK} h-11 w-40`} />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,24.5rem)]">
        <div className="rounded-lg border border-neutral-300 bg-neutral-0 px-4 pb-6 sm:px-6">
          <div className="flex items-center justify-between border-b border-neutral-300 py-5">
            <span className={`${BLOCK} h-6 w-64`} />
            <span className={`${BLOCK} hidden h-4 w-28 sm:block`} />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
            {Array.from({ length: 8 }, (_, index) => (
              <span key={index} className={`${BLOCK} h-[5.75rem]`} />
            ))}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1 xl:content-start">
          <span className={`${BLOCK} h-36 rounded-lg`} />
          <span className={`${BLOCK} h-36 rounded-lg`} />
        </div>
      </div>

      <span className={`${BLOCK} h-80 rounded-lg`} />
      <span className="sr-only">Carregando o painel…</span>
    </div>
  )
}
