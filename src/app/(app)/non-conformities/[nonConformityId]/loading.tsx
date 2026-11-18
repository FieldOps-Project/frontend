const BLOCK = 'animate-pulse rounded-md bg-neutral-200/70'

/** Esqueleto do detalhe da nao conformidade, com a mesma grade da tela pronta. */
export default function NonConformityLoading() {
  return (
    <div role="status" className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <span className={`${BLOCK} h-4 w-36`} />
        <span className={`${BLOCK} h-7 w-28 rounded-full`} />
        <span className={`${BLOCK} h-9 w-[32rem] max-w-full`} />
        <span className={`${BLOCK} h-5 w-[40rem] max-w-full`} />
      </div>
      <span className={`${BLOCK} h-48 rounded-card`} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <span className={`${BLOCK} h-64 rounded-card`} />
        <span className={`${BLOCK} h-64 rounded-card`} />
      </div>
      <span className="sr-only">Carregando a não conformidade…</span>
    </div>
  )
}
