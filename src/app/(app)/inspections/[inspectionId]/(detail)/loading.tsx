const BLOCK = 'animate-pulse rounded-md bg-neutral-200/70'

/** Esqueleto do detalhe da inspecao, com a mesma grade da tela pronta. */
export default function InspectionDetailLoading() {
  return (
    <div role="status" className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <span className={`${BLOCK} h-4 w-24`} />
        <span className={`${BLOCK} h-9 w-72 max-w-full`} />
        <span className={`${BLOCK} h-5 w-56 max-w-full`} />
      </div>
      <div className="grid gap-6 rounded-card border border-neutral-200 bg-neutral-0 p-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }, (_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <span className={`${BLOCK} h-3 w-20`} />
            <span className={`${BLOCK} h-5 w-40 max-w-full`} />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <span className={`${BLOCK} h-64 rounded-card`} />
        <span className={`${BLOCK} h-64 rounded-card`} />
      </div>
      <span className="sr-only">Carregando a inspeção…</span>
    </div>
  )
}
