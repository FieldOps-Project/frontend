import Link from 'next/link'
import { IoLockClosedOutline } from 'react-icons/io5'

import { BUTTON_PRIMARY, CARD } from '@/components/ui/styles'
import { verifySession } from '@/lib/dal'
import { USER_ROLE_LABELS } from '@/lib/domain/user'

/**
 * Destino de todo 403. 401 e 403 sao situacoes diferentes: 401 e sessao
 * ausente e leva ao login; 403 e falta de permissao e vem para ca, sem tirar a
 * pessoa da sessao.
 */
export default async function ForbiddenPage() {
  const user = await verifySession()

  return (
    <section className={`${CARD} mx-auto flex max-w-lg flex-col items-center gap-4 px-6 py-12 text-center`}>
      <IoLockClosedOutline aria-hidden className="size-10 text-neutral-300" />
      <h1 className="text-xl font-semibold text-neutral-900">Acesso negado</h1>
      <p className="text-sm text-neutral-600">
        Seu perfil (<strong>{USER_ROLE_LABELS[user.role]}</strong>) não tem permissão para acessar esta área. Se
        precisar dela, fale com um administrador.
      </p>
      <Link href="/dashboard" className={BUTTON_PRIMARY}>
        Voltar ao início
      </Link>
    </section>
  )
}
