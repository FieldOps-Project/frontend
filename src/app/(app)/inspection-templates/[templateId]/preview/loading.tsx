const BLOCK = 'animate-pulse rounded-md bg-neutral-200/70'

/** Esqueleto da previa e das versoes: o caminho e a coluna do checklist. */
export default function ChecklistLoading() {
  return (
    <div role="status" className="flex flex-col gap-6">
      <span className={`${BLOCK} h-6 w-96 max-w-full`} />
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <span className={`${BLOCK} h-12`} />
        <span className={`${BLOCK} h-7 w-64`} />
        {[3, 2].map((rows, section) => (
          <div key={section} className="flex flex-col gap-3 rounded-lg border border-neutral-300 bg-neutral-0 p-4">
            <span className={`${BLOCK} h-5 w-48`} />
            {Array.from({ length: rows }, (_, row) => (
              <span key={row} className={`${BLOCK} h-16`} />
            ))}
          </div>
        ))}
      </div>
      <span className="sr-only">Carregando o checklist…</span>
    </div>
  )
}
