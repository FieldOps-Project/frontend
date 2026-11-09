'use client'

import { ActionButton } from '@/components/ui/action-button'
import { changeTemplateStatus } from '@/features/templates/actions'
import type { TemplateStatus } from '@/lib/domain/inspection-template'

/**
 * Inativar e reativar modelo publicado (issue #13). A confirmacao diz que as
 * inspecoes existentes nao sao afetadas (RN-022): sem isso, quem inativa um
 * modelo em uso hesita achando que vai apagar o trabalho em campo.
 */
export function TemplateStatusActions({ id, title, status }: { id: string; title: string; status: TemplateStatus }) {
  if (status === 'ACTIVE') {
    return (
      <ActionButton
        tone="danger"
        action={() => changeTemplateStatus(id, 'INACTIVE')}
        confirm={{
          title: `Inativar “${title}”?`,
          description:
            'O modelo deixa de aceitar novos agendamentos. As inspeções já agendadas ou em andamento não são afetadas e continuam com a versão que receberam. Você pode reativá-lo depois.',
          confirmLabel: 'Inativar',
        }}
      >
        Inativar
      </ActionButton>
    )
  }

  if (status === 'INACTIVE') {
    return (
      <ActionButton
        action={() => changeTemplateStatus(id, 'ACTIVE')}
        confirm={{
          title: `Reativar “${title}”?`,
          description: 'As versões disponíveis do modelo voltam a aceitar novos agendamentos.',
          confirmLabel: 'Reativar',
        }}
      >
        Reativar
      </ActionButton>
    )
  }

  return null
}
