import { IoConstructOutline } from 'react-icons/io5'

/**
 * Placeholder das rotas ainda nao implementadas.
 *
 * As rotas de esqueleto existem desde o bootstrap (criterio da issue #1) para
 * que o mapa de navegacao do documento 14.3 seja verificavel antes das telas
 * ficarem prontas. O placeholder diz qual card entrega a tela: tela em branco
 * parece defeito, e quem abre o painel na revisao precisa distinguir "ainda nao
 * foi feito" de "quebrou".
 */
export function RouteScaffold({ title, issue }: { title: string; issue: string }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
        <p className="text-sm text-neutral-500">
          Área do painel administrativo definida no documento 14.3.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-neutral-300 bg-neutral-0 px-6 py-14 text-center">
        <IoConstructOutline aria-hidden className="size-8 text-neutral-300" />
        <p className="text-sm font-medium text-neutral-700">Tela ainda não construída</p>
        <p className="max-w-sm text-sm text-neutral-500">
          O conteúdo desta área é entregue pela issue {issue}.
        </p>
      </div>
    </div>
  )
}
