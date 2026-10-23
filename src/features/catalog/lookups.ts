import 'server-only'

import type { SelectGroup, SelectOption } from '@/components/ui/form-fields'
import { load } from '@/lib/dal'
import type { Client } from '@/lib/domain/client'
import type { Equipment } from '@/lib/domain/equipment'
import { MAX_PAGE_SIZE, type Page } from '@/lib/domain/page'
import type { Site } from '@/lib/domain/site'
import type { User, UserRole } from '@/lib/domain/user'

/**
 * Tabelas de apoio das telas de cadastro: nome do cliente na lista de locais,
 * nome do local na lista de equipamentos e os seletores dos formularios.
 * Carregam ate o limite da API, suficiente para o volume do MVP.
 */
export async function loadClients(status?: 'ACTIVE'): Promise<readonly Client[]> {
  const page = await load<Page<Client>>('/clients', { status, size: MAX_PAGE_SIZE, sort: 'name,asc' })
  return page.content
}

export async function loadSites(status?: 'ACTIVE'): Promise<readonly Site[]> {
  const page = await load<Page<Site>>('/sites', { status, size: MAX_PAGE_SIZE, sort: 'name,asc' })
  return page.content
}

export async function loadEquipment(status?: 'ACTIVE'): Promise<readonly Equipment[]> {
  const page = await load<Page<Equipment>>('/equipment', { status, size: MAX_PAGE_SIZE, sort: 'name,asc' })
  return page.content
}

/** Usuarios ativos de um perfil, como os tecnicos que podem receber atribuicao (RN-027). */
export async function loadActiveUsers(role: UserRole): Promise<readonly User[]> {
  const page = await load<Page<User>>('/users', { role, status: 'ACTIVE', size: MAX_PAGE_SIZE, sort: 'name,asc' })
  return page.content
}

export function byId<T extends { id: string }>(items: readonly T[]): ReadonlyMap<string, T> {
  return new Map(items.map((item) => [item.id, item]))
}

export function clientOptions(clients: readonly Client[]): readonly SelectOption[] {
  return clients.map((client) => ({ value: client.id, label: client.name }))
}

/** Locais agrupados por cliente: "Unidade Centro" se repete entre clientes. */
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
