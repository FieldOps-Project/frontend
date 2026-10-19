'use client'

import { ActionButton } from '@/components/ui/action-button'
import { changeSiteStatus } from '@/features/sites/actions'
import type { SiteStatus } from '@/lib/domain/site'

export function SiteStatusActions({ id, status }: { id: string; status: SiteStatus }) {
  if (status === 'ACTIVE') {
    return (
      <ActionButton
        tone="danger"
        action={() => changeSiteStatus(id, 'INACTIVE')}
        confirm={{
          title: 'Inativar local?',
          description:
            'O local continua no histórico, mas deixa de aceitar novos equipamentos e não aparece para novos agendamentos.',
          confirmLabel: 'Inativar',
        }}
      >
        Inativar local
      </ActionButton>
    )
  }

  return (
    <ActionButton
      action={() => changeSiteStatus(id, 'ACTIVE')}
      confirm={{
        title: 'Reativar local?',
        description: 'O local volta a aceitar equipamentos e agendamentos.',
        confirmLabel: 'Reativar',
      }}
    >
      Reativar local
    </ActionButton>
  )
}
