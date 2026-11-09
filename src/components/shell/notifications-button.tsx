'use client'

import { MdOutlineNotifications, MdOutlineNotificationsNone } from 'react-icons/md'

import { Popover } from '@/components/ui/popover'
import { HEADER_ICON_BUTTON } from '@/components/ui/styles'

/**
 * Sino do cabecalho. A documentacao preve notificacoes so no aplicativo de campo
 * e depois do MVP (documento 15, PBI-074 e PBI-075); ate o painel ter as suas, o
 * painel diz que nao ha nada em vez de mostrar contador inventado.
 */
export function NotificationsButton() {
  return (
    <Popover
      label="Notificações"
      trigger={<MdOutlineNotifications aria-hidden className="size-6" />}
      triggerClassName={HEADER_ICON_BUTTON}
      panelClassName="w-80"
    >
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <p className="text-sm font-semibold text-neutral-900">Notificações</p>
      </div>
      <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
        <MdOutlineNotificationsNone aria-hidden className="size-8 text-neutral-300" />
        <p className="text-sm font-medium text-neutral-700">Nenhuma notificação</p>
        <p className="text-xs text-neutral-500">Avisos sobre inspeções e revisões aparecerão aqui.</p>
      </div>
    </Popover>
  )
}
