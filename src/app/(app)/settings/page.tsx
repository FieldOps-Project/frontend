import { PageHeader } from '@/components/ui/page-header'
import { CARD } from '@/components/ui/styles'
import { verifySession } from '@/lib/dal'
import { environmentLabel } from '@/lib/environment'
import { USER_ROLE_LABELS } from '@/lib/domain/user'

/**
 * Configuracoes da conta, aberta pelo rodape do menu.
 *
 * O documento 14 nao preve preferencias editaveis no MVP; a tela mostra quem
 * esta logado, com qual perfil e em qual ambiente, que e o que a pessoa costuma
 * procurar aqui. Troca de senha segue pelo fluxo controlado de redefinicao
 * (documento 14.6), feito por um administrador.
 */
export default async function SettingsPage() {
  const user = await verifySession()

  const rows = [
    { label: 'Nome', value: user.name },
    { label: 'E-mail', value: user.email },
    { label: 'Perfil', value: USER_ROLE_LABELS[user.role] },
    { label: 'Ambiente', value: environmentLabel(process.env.NEXT_PUBLIC_APP_ENV) },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Configurações" description="Dados da sua conta no painel administrativo." />

      <section aria-labelledby="account-title" className={`${CARD} max-w-2xl`}>
        <h2 id="account-title" className="border-b border-neutral-200 px-5 py-4 text-base font-semibold text-neutral-900">
          Conta
        </h2>
        <dl className="divide-y divide-neutral-100">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:gap-6">
              <dt className="text-sm text-neutral-500 sm:w-32 sm:shrink-0">{row.label}</dt>
              <dd className="min-w-0 text-sm font-medium break-words text-neutral-900">{row.value}</dd>
            </div>
          ))}
        </dl>
        <p className="border-t border-neutral-200 px-5 py-4 text-sm text-neutral-500">
          Para trocar a senha ou o perfil, peça a um administrador a redefinição de acesso.
        </p>
      </section>
    </div>
  )
}
