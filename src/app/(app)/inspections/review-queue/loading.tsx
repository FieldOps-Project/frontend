const BLOCK = 'animate-pulse rounded-md bg-neutral-200/70'

/** Esqueleto da fila de revisao, com a mesma grade da tela pronta. */
export default function ReviewQueueLoading() {
  return (
    <div role="status" className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <span className={`${BLOCK} h-10 w-72 max-w-full`} />
        <span className={`${BLOCK} h-6 w-[32rem] max-w-full`} />
      </div>
      <div className="flex flex-col divide-y divide-neutral-100 overflow-hidden rounded-card border border-neutral-200 bg-neutral-0">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="flex items-center gap-4 px-5 py-4">
            <span className={`${BLOCK} h-5 w-32`} />
            <span className={`${BLOCK} h-5 flex-1`} />
            <span className={`${BLOCK} hidden h-5 w-28 sm:block`} />
            <span className={`${BLOCK} h-10 w-24`} />
          </div>
        ))}
      </div>
      <span className="sr-only">Carregando a fila de revisão…</span>
    </div>
  )
}
