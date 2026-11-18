const BLOCK = 'animate-pulse rounded-md bg-neutral-200/70'

/** Esqueleto da auditoria, com a mesma grade da tela pronta. */
export default function AuditLoading() {
  return (
    <div role="status" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <span className={`${BLOCK} h-10 w-80 max-w-full`} />
          <span className={`${BLOCK} h-6 w-[28rem] max-w-full`} />
        </div>
        <span className={`${BLOCK} h-12 w-52`} />
      </div>
      <div className="grid gap-4 rounded-card border border-neutral-200 bg-neutral-0 p-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <span key={index} className={`${BLOCK} h-11`} />
        ))}
      </div>
      <div className="flex flex-col divide-y divide-neutral-100 overflow-hidden rounded-card border border-neutral-200 bg-neutral-0">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex items-center gap-4 px-4 py-4">
            <span className={`${BLOCK} h-5 w-20`} />
            <span className={`${BLOCK} h-5 w-36`} />
            <span className={`${BLOCK} h-8 w-32 rounded-full`} />
            <span className={`${BLOCK} h-7 w-40`} />
            <span className={`${BLOCK} h-5 flex-1`} />
          </div>
        ))}
      </div>
      <span className="sr-only">Carregando a auditoria…</span>
    </div>
  )
}
