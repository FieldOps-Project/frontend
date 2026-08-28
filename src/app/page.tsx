import { redirect } from 'next/navigation'

/**
 * A raiz nao tem conteudo proprio: o painel comeca no dashboard. Quem chegar
 * aqui sem sessao e desviado para o login pelo proxy antes de renderizar.
 */
export default function RootPage() {
  redirect('/dashboard')
}
