const BLOCK = 'animate-pulse rounded-md bg-neutral-200/70'

/** Esqueleto da lista de modelos, com a mesma grade da tela pronta. */
export default function InspectionTemplatesLoading() {
  return (
    <div role="status" className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <span className={`${BLOCK} h-10 w-80 max-w-full`} />
        <span className={`${BLOCK} h-6 w-[30rem] max-w-full`} />
      </div>

      <div className="overflow-hidden rounded-card border border-neutral-200 bg-neutral-0">
        <div className="flex flex-wrap gap-3 border-b border-neutral-200 p-4">
          <span className={`${BLOCK} h-10 min-w-48 flex-1`} />
          <span className={`${BLOCK} h-10 w-40`} />
          <span className={`${BLOCK} h-10 w-40`} />
        </div>
        <div className="flex flex-col divide-y divide-neutral-100">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="flex items-center gap-4 px-4 py-4">
              <span className={`${BLOCK} h-5 flex-1`} />
              <span className={`${BLOCK} hidden h-5 w-32 sm:block`} />
              <span className={`${BLOCK} h-6 w-36`} />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Carregando os modelos…</span>
    </div>
  )
}
