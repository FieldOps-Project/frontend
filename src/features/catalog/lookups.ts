import 'server-only'

import type { SelectGroup, SelectOption } from '@/components/ui/form-fields'
import { load } from '@/lib/dal'
import type { Client } from '@/lib/domain/client'
import type { Equipment } from '@/lib/domain/equipment'
import { MAX_PAGE_SIZE, type Page } from '@/lib/domain/page'
import type { Site } from '@/lib/domain/site'
import type { User, UserRole } from '@/lib/domain/user'

const MAX_LOOKUP_PAGES = 10

type LookupQuery = Readonly<Record<string, string | undefined>>

export async function loadAllPages<T>(path: string, query: LookupQuery, sort = 'name,asc'): Promise<readonly T[]> {
  const fetchPage = (page: number) => load<Page<T>>(path, { ...query, page, size: MAX_PAGE_SIZE, sort })

  const first = await fetchPage(0)
  const remaining = Math.min(first.totalPages, MAX_LOOKUP_PAGES) - 1
  const rest = await Promise.all(Array.from({ length: Math.max(remaining, 0) }, (_, index) => fetchPage(index + 1)))

  return [first, ...rest].flatMap((page) => page.content)
}

export function loadClients(status?: 'ACTIVE'): Promise<readonly Client[]> {
  return loadAllPages<Client>('/clients', { status })
}

export function loadSites(status?: 'ACTIVE'): Promise<readonly Site[]> {
  return loadAllPages<Site>('/sites', { status })
}

export function loadEquipment(status?: 'ACTIVE'): Promise<readonly Equipment[]> {
  return loadAllPages<Equipment>('/equipment', { status })
}

export function loadActiveUsers(role: UserRole): Promise<readonly User[]> {
  return loadAllPages<User>('/users', { role, status: 'ACTIVE' })
}

export function byId<T extends { id: string }>(items: readonly T[]): ReadonlyMap<string, T> {
  return new Map(items.map((item) => [item.id, item]))
}

export function clientOptions(clients: readonly Client[]): readonly SelectOption[] {
  return clients.map((client) => ({ value: client.id, label: client.name }))
}

export function siteGroups(sites: readonly Site[], clients: ReadonlyMap<string, Client>): readonly SelectGroup[] {
  const groups = new Map<string, SelectOption[]>()

  for (const site of sites) {
    const label = clients.get(site.clientId)?.name ?? 'Outros'
    const options = groups.get(label) ?? []
    options.push({ value: site.id, label: [site.name, site.city].filter(Boolean).join(' — ') })
    groups.set(label, options)
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))
    .map(([label, options]) => ({ label, options }))
}
