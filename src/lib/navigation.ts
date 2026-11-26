import { FIELD_FINDINGS_ROLES } from '@/lib/domain/non-conformity'
import type { UserRole } from '@/lib/domain/user'

export type NavigationItem = {
  readonly label: string
  readonly href: string
  readonly roles: readonly UserRole[]
}

const ADMINISTRATIVE: readonly UserRole[] = ['ADMIN', 'SUPERVISOR']

export const NAVIGATION: readonly NavigationItem[] = [
  { label: 'Dashboard', href: '/dashboard', roles: ADMINISTRATIVE },
  { label: 'Usuários', href: '/users', roles: ['ADMIN'] },
  { label: 'Clientes', href: '/clients', roles: ADMINISTRATIVE },
  { label: 'Locais', href: '/sites', roles: ADMINISTRATIVE },
  { label: 'Equipamentos', href: '/equipment', roles: ADMINISTRATIVE },
  { label: 'Modelos de Inspeção', href: '/inspection-templates', roles: ADMINISTRATIVE },
  { label: 'Inspeções', href: '/inspections', roles: ADMINISTRATIVE },
  { label: 'Não Conformidades', href: '/non-conformities', roles: FIELD_FINDINGS_ROLES },
  { label: 'Auditoria', href: '/audit', roles: ADMINISTRATIVE },
]

export function navigationFor(role: UserRole): readonly NavigationItem[] {
  return NAVIGATION.filter((item) => item.roles.includes(role))
}

export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}
