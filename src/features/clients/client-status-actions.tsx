'use client'

import { ActionButton } from '@/components/ui/action-button'
import { changeClientStatus } from '@/features/clients/actions'
import type { ClientStatus } from '@/lib/domain/client'

/**
 * Inativacao e logica: o cliente continua nas inspecoes historicas, mas deixa
 * de aceitar novos locais e agendamentos (RN-013). A confirmacao diz isso.
 */
export function ClientStatusActions({ id, status }: { id: string; status: ClientStatus }) {
  if (status === 'ACTIVE') {
    return (
      <ActionButton
        tone="danger"
        action={() => changeClientStatus(id, 'INACTIVE')}
        confirm={{
          title: 'Inativar cliente?',
          description:
            'O cliente continua visível no histórico, mas deixa de aceitar novos locais e novos agendamentos. Você pode reativá-lo depois.',
          confirmLabel: 'Inativar',
        }}
      >
        Inativar cliente
      </ActionButton>
    )
  }

  return (
    <ActionButton
      action={() => changeClientStatus(id, 'ACTIVE')}
      confirm={{
        title: 'Reativar cliente?',
        description: 'O cliente volta a aceitar novos locais e agendamentos.',
        confirmLabel: 'Reativar',
      }}
    >
      Reativar cliente
    </ActionButton>
  )
}
