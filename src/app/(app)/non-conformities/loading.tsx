const BLOCK = 'animate-pulse rounded-md bg-neutral-200/70'

/** Esqueleto da listagem de nao conformidades, com a mesma grade da tela pronta. */
export default function NonConformitiesLoading() {
  return (
    <div role="status" className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <span className={`${BLOCK} h-10 w-80 max-w-full`} />
        <span className={`${BLOCK} h-6 w-[28rem] max-w-full`} />
      </div>
      <div className="grid gap-4 rounded-card border border-neutral-200 bg-neutral-0 p-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <span key={index} className={`${BLOCK} h-11`} />
        ))}
      </div>
      <div className="flex flex-col divide-y divide-neutral-100 overflow-hidden rounded-card border border-neutral-200 bg-neutral-0">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex items-center gap-4 px-5 py-4">
            <span className={`${BLOCK} h-7 w-24`} />
            <span className={`${BLOCK} h-5 flex-1`} />
            <span className={`${BLOCK} hidden h-5 w-32 sm:block`} />
          </div>
        ))}
      </div>
      <span className="sr-only">Carregando as não conformidades…</span>
    </div>
  )
}
