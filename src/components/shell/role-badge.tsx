import { USER_ROLE_LABELS, USER_ROLE_SHORT_LABELS, type UserRole } from '@/lib/domain/user'

/**
 * Selo do perfil no cabecalho ("ADMIN"). O perfil decide o que a pessoa pode
 * fazer no painel, entao fica a vista; o nome completo vai no `title` e para
 * leitores de tela.
 */
export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      title={USER_ROLE_LABELS[role]}
      className="hidden rounded-sm bg-brand-600 px-2.5 py-1 text-sm font-semibold tracking-wide whitespace-nowrap text-neutral-0 uppercase sm:inline-block"
    >
      <span aria-hidden>{USER_ROLE_SHORT_LABELS[role]}</span>
      <span className="sr-only">Perfil: {USER_ROLE_LABELS[role]}</span>
    </span>
  )
}
