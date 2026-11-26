'use client'

import { ActionButton } from '@/components/ui/action-button'
import { changeVersionAvailability } from '@/features/templates/actions'

export function VersionAvailabilityAction({
  versionId,
  versionNumber,
  active,
}: {
  versionId: string
  versionNumber: number
  active: boolean
}) {
  if (active) {
    return (
      <ActionButton
        tone="danger"
        action={() => changeVersionAvailability(versionId, false)}
        confirm={{
          title: `Retirar a versão ${versionNumber} dos novos agendamentos?`,
          description:
            'Novas inspeções deixam de poder usar esta versão. As inspeções já agendadas ou em andamento continuam com ela. Você pode liberá-la de novo depois.',
          confirmLabel: 'Retirar',
        }}
      >
        Retirar
      </ActionButton>
    )
  }

  return (
    <ActionButton
      action={() => changeVersionAvailability(versionId, true)}
      confirm={{
        title: `Liberar a versão ${versionNumber} para novos agendamentos?`,
        description: 'Novas inspeções passam a poder usar esta versão.',
        confirmLabel: 'Liberar',
      }}
    >
      Liberar
    </ActionButton>
  )
}
