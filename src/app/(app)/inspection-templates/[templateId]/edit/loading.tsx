const BLOCK = 'animate-pulse rounded-md bg-neutral-200/70'

/** Esqueleto do construtor, com as duas colunas da tela pronta. */
export default function TemplateBuilderLoading() {
  return (
    <div role="status" className="flex flex-col gap-6">
      <span className={`${BLOCK} h-6 w-96 max-w-full`} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:grid-cols-[24rem_minmax(0,1fr)]">
        <div className="flex flex-col gap-4 rounded-lg border border-neutral-300 bg-neutral-0 p-6">
          <span className={`${BLOCK} h-6 w-56`} />
          <span className={`${BLOCK} h-11`} />
          <span className={`${BLOCK} h-24`} />
          <span className={`${BLOCK} h-11`} />
          <span className={`${BLOCK} mt-4 h-40`} />
        </div>

        <div className="flex flex-col gap-6">
          {[3, 2].map((rows, section) => (
            <div key={section} className="overflow-hidden rounded-lg border border-neutral-300 bg-neutral-0">
              <div className="flex items-center gap-4 border-b border-neutral-200 px-6 py-5">
                <span className={`${BLOCK} size-10`} />
                <span className={`${BLOCK} h-6 w-64`} />
              </div>
              {Array.from({ length: rows }, (_, row) => (
                <div key={row} className="flex items-center gap-4 border-b border-neutral-100 px-6 py-5 last:border-0">
                  <span className={`${BLOCK} h-5 flex-1`} />
                  <span className={`${BLOCK} h-6 w-24`} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Carregando o construtor…</span>
    </div>
  )
}
