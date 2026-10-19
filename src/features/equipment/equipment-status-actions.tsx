'use client'

import { ActionButton } from '@/components/ui/action-button'
import { changeEquipmentStatus } from '@/features/equipment/actions'
import type { EquipmentStatus } from '@/lib/domain/equipment'

export function EquipmentStatusActions({ id, status }: { id: string; status: EquipmentStatus }) {
  return (
    <div className="flex flex-wrap gap-2">
      {status === 'ACTIVE' && (
        <ActionButton
          action={() => changeEquipmentStatus(id, 'INACTIVE')}
          confirm={{
            title: 'Inativar equipamento?',
            description:
              'O equipamento fica fora de operação temporariamente e não aparece para novos agendamentos. Pode ser reativado depois.',
            confirmLabel: 'Inativar',
          }}
        >
          Inativar
        </ActionButton>
      )}

      {status !== 'ACTIVE' && (
        <ActionButton
          action={() => changeEquipmentStatus(id, 'ACTIVE')}
          confirm={{
            title: status === 'DECOMMISSIONED' ? 'Desfazer a baixa?' : 'Reativar equipamento?',
            description: 'O equipamento volta a ficar disponível para novos agendamentos.',
            confirmLabel: 'Reativar',
          }}
        >
          {status === 'DECOMMISSIONED' ? 'Desfazer baixa' : 'Reativar'}
        </ActionButton>
      )}

      {status !== 'DECOMMISSIONED' && (
        <ActionButton
          tone="danger"
          action={() => changeEquipmentStatus(id, 'DECOMMISSIONED')}
          confirm={{
            title: 'Dar baixa no equipamento?',
            description:
              'Use quando o equipamento foi retirado de uso definitivamente. Ele continua no histórico das inspeções já feitas, mas não poderá ser agendado.',
            confirmLabel: 'Dar baixa',
          }}
        >
          Dar baixa
        </ActionButton>
      )}
    </div>
  )
}
