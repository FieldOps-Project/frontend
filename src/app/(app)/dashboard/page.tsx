import Link from 'next/link'
import type { IconType } from 'react-icons'
import {
  IoBusinessOutline,
  IoClipboardOutline,
  IoConstructOutline,
  IoLocationOutline,
  IoPeopleOutline,
} from 'react-icons/io5'

import { PageHeader } from '@/components/ui/page-header'
import { CARD } from '@/components/ui/styles'
import { load, verifySession } from '@/lib/dal'
import type { InspectionSummary } from '@/lib/domain/inspection'
import type { Page } from '@/lib/domain/page'

type Card = {
  readonly label: string
  readonly value: number
  readonly detail: string
  readonly href: string
  readonly icon: IconType
}

/** So a contagem interessa: `size=1` evita trazer a pagina inteira para ler `totalElements`. */
async function count(path: string, query: Record<string, string> = {}): Promise<number> {
  const page = await load<Page<unknown>>(path, { ...query, size: 1 })
  return page.totalElements
}

/**
 * Resumo do painel (issue #28, P1). Cada numero e link para a listagem com o
 * filtro correspondente ja aplicado, para que o numero e a lista nunca
 * divirjam.
 */
export default async function DashboardPage() {
  const user = await verifySession()

  const [clients, sites, equipment, inspections, users] = await Promise.all([
    count('/clients', { status: 'ACTIVE' }),
    count('/sites', { status: 'ACTIVE' }),
    count('/equipment', { status: 'ACTIVE' }),
    load<readonly InspectionSummary[]>('/inspections'),
    user.role === 'ADMIN' ? count('/users', { status: 'ACTIVE' }) : Promise.resolve(null),
  ])

  const cards: Card[] = [
    { label: 'Clientes ativos', value: clients, detail: 'Ver clientes', href: '/clients?status=ACTIVE', icon: IoBusinessOutline },
    { label: 'Locais ativos', value: sites, detail: 'Ver locais', href: '/sites?status=ACTIVE', icon: IoLocationOutline },
    {
      label: 'Equipamentos ativos',
      value: equipment,
      detail: 'Ver equipamentos',
      href: '/equipment?status=ACTIVE',
      icon: IoConstructOutline,
    },
    {
      label: 'Inspeções',
      value: inspections.length,
      detail: 'Dados de exemplo da API',
      href: '/inspections',
      icon: IoClipboardOutline,
    },
  ]

  if (users !== null) {
    cards.push({ label: 'Usuários ativos', value: users, detail: 'Ver usuários', href: '/users?status=ACTIVE', icon: IoPeopleOutline })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Olá, ${user.name.split(' ')[0]}`} description="Resumo da operação." />

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <li key={card.label}>
            <Link
              href={card.href}
              className={`${CARD} flex items-center gap-4 p-5 transition-colors hover:border-brand-300 hover:bg-brand-50/40`}
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-field bg-brand-50 text-brand-700">
                <card.icon aria-hidden className="size-5" />
              </span>
              <span className="flex flex-col">
                <span className="text-sm text-neutral-500">{card.label}</span>
                <span className="text-2xl font-semibold text-neutral-900">{card.value}</span>
                <span className="text-xs text-brand-700">{card.detail}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
