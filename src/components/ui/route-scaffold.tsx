/**
 * Placeholder das rotas ainda nao implementadas.
 *
 * As rotas de esqueleto precisam existir desde o bootstrap (criterio de
 * aceitacao da issue #1) para que o mapa de navegacao do documento 14.3 seja
 * verificavel antes das telas ficarem prontas. Cada tela substitui este
 * componente pelo seu proprio conteudo no card correspondente.
 */
export function RouteScaffold({ title, issue }: { title: string; issue: string }) {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-2 p-8">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-sm text-neutral-500">Tela prevista para a issue {issue}.</p>
    </main>
  )
}
