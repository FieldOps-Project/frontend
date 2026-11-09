import type { IconType } from 'react-icons'
import { MdOpenInNew, MdOutlineBugReport, MdOutlineMenuBook } from 'react-icons/md'

import { PageHeader } from '@/components/ui/page-header'
import { CARD } from '@/components/ui/styles'

type Channel = {
  readonly title: string
  readonly description: string
  readonly href: string
  readonly icon: IconType
}

const CHANNELS: readonly Channel[] = [
  {
    title: 'Documentação do produto',
    description: 'Perfis, fluxos, regras de negócio e o funcionamento de cada tela do painel.',
    href: 'https://github.com/FieldOps-Project/docs/tree/main/notion',
    icon: MdOutlineMenuBook,
  },
  {
    title: 'Relatar um problema',
    description: 'Abra um chamado descrevendo o que aconteceu, a tela e o horário aproximado.',
    href: 'https://github.com/FieldOps-Project/frontend/issues/new/choose',
    icon: MdOutlineBugReport,
  },
]

/** Suporte, aberto pelo rodape do menu e pelo icone de ajuda do cabecalho. */
export default function SupportPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Suporte" description="Onde encontrar ajuda sobre o painel administrativo." />

      <ul className="grid max-w-4xl gap-4 md:grid-cols-2">
        {CHANNELS.map((channel) => (
          <li key={channel.href}>
            <a
              href={channel.href}
              target="_blank"
              rel="noreferrer"
              className={`${CARD} flex h-full items-start gap-4 p-5 transition-colors hover:border-brand-300 hover:bg-brand-50/40`}
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-field bg-brand-50 text-brand-700">
                <channel.icon aria-hidden className="size-6" />
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <span className="flex items-center gap-1.5 font-semibold text-neutral-900">
                  {channel.title}
                  <MdOpenInNew aria-hidden className="size-4 text-neutral-400" />
                  <span className="sr-only">(abre em nova aba)</span>
                </span>
                <span className="text-sm text-neutral-600">{channel.description}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
