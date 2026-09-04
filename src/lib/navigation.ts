import type { UserRole } from '@/lib/domain/user'

export type NavigationItem = {
  readonly label: string
  readonly href: string
  /** Perfis que enxergam o item, conforme a matriz do documento 5.2. */
  readonly roles: readonly UserRole[]
}

const ADMINISTRATIVE: readonly UserRole[] = ['ADMIN', 'SUPERVISOR']

/**
 * Areas do painel, na ordem do mapa de navegacao do documento 14.3.
 *
 * O perfil filtra o que aparece, mas isso e comodidade e nao seguranca: quem
 * conhece o endereco continua conseguindo digita-lo. A decisao que vale e da
 * API, revalidada na camada de acesso a dados (documento 14.13).
 */
export const NAVIGATION: readonly NavigationItem[] = [
  { label: 'Dashboard', href: '/dashboard', roles: ADMINISTRATIVE },
  { label: 'Usuários', href: '/users', roles: ['ADMIN'] },
  { label: 'Clientes', href: '/clients', roles: ADMINISTRATIVE },
  { label: 'Locais', href: '/sites', roles: ADMINISTRATIVE },
  { label: 'Equipamentos', href: '/equipment', roles: ADMINISTRATIVE },
  { label: 'Modelos de inspeção', href: '/inspection-templates', roles: ADMINISTRATIVE },
  { label: 'Inspeções', href: '/inspections', roles: ADMINISTRATIVE },
  { label: 'Não conformidades', href: '/non-conformities', roles: ADMINISTRATIVE },
  { label: 'Auditoria', href: '/audit', roles: ADMINISTRATIVE },
]

export function navigationFor(role: UserRole): readonly NavigationItem[] {
  return NAVIGATION.filter((item) => item.roles.includes(role))
}

/**
 * Um item fica ativo tambem nas rotas filhas: em `/clients/123/sites` o menu
 * precisa continuar indicando "Clientes", senao a pessoa perde a referencia de
 * onde esta assim que abre um detalhe.
 */
export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}
