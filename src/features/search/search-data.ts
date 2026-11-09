import 'server-only'

import { loadInspectionPage } from '@/features/inspections/list-data'
import { load } from '@/lib/dal'
import type { Client } from '@/lib/domain/client'
import type { Equipment } from '@/lib/domain/equipment'
import type { Page } from '@/lib/domain/page'
import type { Site } from '@/lib/domain/site'
import type { User, UserRole } from '@/lib/domain/user'

/** Resultados por area mostrados de cada vez; o restante fica a um clique, na listagem. */
export const SEARCH_LIMIT = 5

/** Menos que isso devolve meio cadastro e nao ajuda a achar nada. */
export const SEARCH_MIN_LENGTH = 2

export type SearchHit = {
  readonly id: string
  readonly title: string
  readonly detail: string | null
  readonly href: string
}

export type SearchGroup = {
  readonly key: 'inspections' | 'clients' | 'sites' | 'equipment' | 'users'
  readonly label: string
  readonly hits: readonly SearchHit[]
  readonly total: number
  /** Listagem completa com o mesmo termo. */
  readonly moreHref: string
}

function joined(...parts: readonly (string | null | undefined)[]): string | null {
  const text = parts.filter((part) => part && part.trim() !== '').join(' · ')
  return text === '' ? null : text
}

/**
 * Busca no painel inteiro: cada area pelo filtro de texto que a propria
 * listagem ja usa (`q` nas inspecoes, `search` nos cadastros e `name` nos
 * usuarios), em paralelo. Usuarios so para o administrador, unico perfil que
 * enxerga essa area (documento 5.2).
 */
export async function searchWorkspace(term: string, role: UserRole): Promise<readonly SearchGroup[]> {
  const query = encodeURIComponent(term)
  const page = { size: SEARCH_LIMIT }

  const [inspections, clients, sites, equipment, users] = await Promise.all([
    loadInspectionPage({ q: term }, 0, SEARCH_LIMIT),
    load<Page<Client>>('/clients', { search: term, ...page, sort: 'name,asc' }),
    load<Page<Site>>('/sites', { search: term, ...page, sort: 'name,asc' }),
    load<Page<Equipment>>('/equipment', { search: term, ...page, sort: 'name,asc' }),
    role === 'ADMIN' ? load<Page<User>>('/users', { name: term, ...page, sort: 'name,asc' }) : Promise.resolve(null),
  ])

  const groups: SearchGroup[] = [
    {
      key: 'inspections',
      label: 'Inspeções',
      total: inspections.totalElements,
      moreHref: `/inspections?q=${query}`,
      hits: inspections.content.map((item) => ({
        id: item.id,
        title: `${item.code} · ${item.title}`,
        detail: joined(item.clientName, item.siteName),
        href: `/inspections?q=${encodeURIComponent(item.code)}`,
      })),
    },
    {
      key: 'clients',
      label: 'Clientes',
      total: clients.totalElements,
      moreHref: `/clients?search=${query}`,
      hits: clients.content.map((client) => ({
        id: client.id,
        title: client.name,
        detail: client.legalName,
        href: `/clients/${client.id}`,
      })),
    },
    {
      key: 'sites',
      label: 'Locais',
      total: sites.totalElements,
      moreHref: `/sites?search=${query}`,
      hits: sites.content.map((site) => ({
        id: site.id,
        title: site.name,
        detail: joined(site.city, site.state),
        href: `/sites/${site.id}`,
      })),
    },
    {
      key: 'equipment',
      label: 'Equipamentos',
      total: equipment.totalElements,
      moreHref: `/equipment?search=${query}`,
      hits: equipment.content.map((item) => ({
        id: item.id,
        title: item.name,
        detail: joined(item.assetNumber, item.manufacturer, item.model),
        href: `/equipment/${item.id}`,
      })),
    },
  ]

  if (users) {
    groups.push({
      key: 'users',
      label: 'Usuários',
      total: users.totalElements,
      moreHref: `/users?name=${query}`,
      hits: users.content.map((user) => ({ id: user.id, title: user.name, detail: user.email, href: `/users/${user.id}` })),
    })
  }

  return groups
}
