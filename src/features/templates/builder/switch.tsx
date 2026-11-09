'use client'

/**
 * Chave liga/desliga das regras do item ("Obrigatório", "Exigir Evidência"),
 * como no desenho do construtor. E um `switch` de verdade para leitor de tela,
 * com o rotulo clicavel.
 */
export function Switch({
  label,
  checked,
  onChange,
  marker,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  /** Sinal visual ao lado do rotulo, como o "!" da evidencia. */
  marker?: string
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm font-medium text-neutral-900">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-brand-700' : 'bg-neutral-300'
        }`}
      >
        <span
          aria-hidden
          className={`inline-block size-4 rounded-full bg-neutral-0 shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </button>
      <span>
        {label}
        {marker && (
          <span aria-hidden className="ml-1.5 font-bold text-danger">
            {marker}
          </span>
        )}
      </span>
    </label>
  )
}
