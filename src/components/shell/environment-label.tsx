import { environmentLabel, isProductionEnvironment } from '@/lib/environment'

/**
 * Ambiente no cabecalho, exigido pelo documento 14.4: "Ambiente: Produção".
 *
 * Fora de producao o rotulo ganha o destaque de alerta e continua visivel ate
 * no celular -- sem ele, e questao de tempo ate alguem aprovar ou cancelar uma
 * inspecao de teste acreditando estar no ambiente real. Em producao ele e
 * informativo e cede espaco em tela estreita, onde aparece no menu do avatar.
 */
export function EnvironmentLabel({ environment }: { environment: string | undefined }) {
  const label = environmentLabel(environment)

  if (isProductionEnvironment(environment)) {
    return (
      <span className="hidden text-sm font-medium whitespace-nowrap text-neutral-900 md:inline">Ambiente: {label}</span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-warning-soft px-2 py-1 text-xs font-semibold whitespace-nowrap text-warning md:text-sm">
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      <span className="hidden md:inline">Ambiente:</span> {label}
    </span>
  )
}
