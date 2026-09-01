'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { NAVIGATION } from '@/lib/navigation'

const SEGMENT_LABELS: Record<string, string> = {
  ...Object.fromEntries(NAVIGATION.map((item) => [item.href.slice(1), item.label])),
  new: 'Novo',
  edit: 'Editar',
  preview: 'Prévia',
  versions: 'Versões',
  review: 'Revisão',
  sites: 'Locais',
  equipment: 'Equipamentos',
}

/**
 * Identificadores sao UUID (documento 12.1). Mostrar o identificador cru no
 * caminho nao ajuda ninguem a se localizar; ate a tela carregar o nome do
 * registro, "Detalhe" e mais informativo.
 */
const IDENTIFIER = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function labelFor(segment: string): string {
  if (IDENTIFIER.test(segment)) {
    return 'Detalhe'
  }

  return SEGMENT_LABELS[segment] ?? segment
}

/**
 * Caminho de navegacao derivado da rota, exigido pelo documento 14.4.
 *
 * O ultimo item nao e link: ele representa a pagina atual, e link para onde ja
 * se esta confunde quem navega por teclado ou leitor de tela.
 */
export function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) {
    return null
  }

  return (
    <nav aria-label="Você está em" className="px-6 py-3 text-sm text-neutral-500">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link href="/dashboard" className="hover:text-neutral-700">
            Início
          </Link>
        </li>
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join('/')}`
          const last = index === segments.length - 1

          return (
            <li key={href} className="flex items-center gap-2">
              <span aria-hidden>›</span>
              {last ? (
                <span aria-current="page" className="font-medium text-neutral-700">
                  {labelFor(segment)}
                </span>
              ) : (
                <Link href={href} className="hover:text-neutral-700">
                  {labelFor(segment)}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
