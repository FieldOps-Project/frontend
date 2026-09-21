const LABELS: Record<string, string> = {
  development: 'Desenvolvimento',
  staging: 'Homologação',
}

/**
 * Faixa de ambiente exigida pelo documento 14.4.
 *
 * Nao e enfeite: sem ela, e questao de tempo ate alguem aprovar ou cancelar uma
 * inspecao de teste acreditando estar no ambiente real. Em producao o
 * componente nao renderiza nada.
 */
export function EnvironmentBadge({ environment }: { environment: string | undefined }) {
  const label = environment ? LABELS[environment] : undefined

  if (!label) {
    return null
  }

  return (
    <span className="rounded-field bg-warning-soft px-2 py-1 text-xs font-semibold tracking-wide text-warning uppercase">
      {label}
    </span>
  )
}
