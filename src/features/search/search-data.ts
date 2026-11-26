import 'server-only'

import { loadInspectionPage } from '@/features/inspections/list-data'
import { load } from '@/lib/dal'
import { inspectionReference } from '@/lib/domain/inspection'
import type { Client } from '@/lib/domain/client'
import type { Equipment } from '@/lib/domain/equipment'
import type { Page } from '@/lib/domain/page'
import type { Site } from '@/lib/domain/site'
import type { User, UserRole } from '@/lib/domain/user'

export const SEARCH_LIMIT = 5

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
  readonly moreHref: string
}

function joined(...parts: readonly (string | null | undefined)[]): string | null {
  const text = parts.filter((part) => part && part.trim() !== '').join(' · ')
  return text === '' ? null : text
}

export async function searchWorkspace(term: string, role: UserRole): Promise<readonly SearchGroup[]> {
  const query = encodeURIComponent(term)
  const page = { size: SEARCH_LIMIT }

  const [inspections, clients, sites, equipment, users] = await Promise.all([
    loadInspectionPage({ search: term }, 0, SEARCH_LIMIT),
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
      moreHref: `/inspections?search=${query}`,
      hits: inspections.content.map((item) => ({
        id: item.id,
        title: `${inspectionReference(item.id)} · ${item.title}`,
        detail: joined(item.clientName, item.siteName),
        href: `/inspections/${item.id}`,
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
