import Link from 'next/link'

const TAB = 'inline-flex h-10 items-center rounded-field border px-4 text-sm font-medium transition-colors'
const ACTIVE = `${TAB} border-brand-700 bg-brand-700 text-neutral-0`
const IDLE = `${TAB} border-neutral-200 bg-neutral-0 text-neutral-800 hover:bg-neutral-100`

export function AuditScopeNav({ recent }: { recent: boolean }) {
  return (
    <nav aria-label="Escopo da auditoria" className="flex flex-wrap gap-2">
      <Link href="/audit" aria-current={recent ? undefined : 'page'} className={recent ? IDLE : ACTIVE}>
        Por inspeção
      </Link>
      <Link href="/audit?scope=recent" aria-current={recent ? 'page' : undefined} className={recent ? ACTIVE : IDLE}>
        Atividade recente
      </Link>
    </nav>
  )
}
