'use client'

import { useState } from 'react'

import { ActionButton } from '@/components/ui/action-button'
import { changeUserStatus, resetUserPassword } from '@/features/users/actions'
import type { UserStatus } from '@/lib/domain/user'

export function UserAccessActions({ id, status, isSelf }: { id: string; status: UserStatus; isSelf: boolean }) {
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {status !== 'ACTIVE' && (
          <ActionButton
            action={() => changeUserStatus(id, 'ACTIVE')}
            confirm={{
              title: 'Reativar usuário?',
              description: 'O usuário volta a conseguir entrar com a senha atual.',
              confirmLabel: 'Reativar',
            }}
          >
            Reativar
          </ActionButton>
        )}

        {!isSelf && status !== 'BLOCKED' && (
          <ActionButton
            tone="danger"
            action={() => changeUserStatus(id, 'BLOCKED')}
            confirm={{
              title: 'Bloquear usuário?',
              description: 'O usuário perde o acesso imediatamente e todas as sessões ativas dele são encerradas.',
              confirmLabel: 'Bloquear',
            }}
          >
            Bloquear
          </ActionButton>
        )}

        {!isSelf && status !== 'INACTIVE' && (
          <ActionButton
            tone="danger"
            action={() => changeUserStatus(id, 'INACTIVE')}
            confirm={{
              title: 'Inativar usuário?',
              description:
                'O usuário perde o acesso e as sessões ativas dele são encerradas. O cadastro e o histórico são preservados.',
              confirmLabel: 'Inativar',
            }}
          >
            Inativar
          </ActionButton>
        )}

        <ActionButton
          action={() => resetUserPassword(id)}
          onSuccess={(result) => setTemporaryPassword(result.ok && typeof result.data === 'string' ? result.data : null)}
          confirm={{
            title: 'Redefinir a senha?',
            description:
              'Uma senha temporária será gerada e exibida uma única vez. A senha atual deixa de valer e as sessões do usuário são encerradas.',
            confirmLabel: 'Redefinir',
          }}
        >
          Redefinir senha
        </ActionButton>
      </div>

      {temporaryPassword && (
        <div role="status" className="flex flex-col gap-2 rounded-card border border-warning/30 bg-warning-soft p-4 text-sm">
          <p className="font-medium text-warning">Senha temporária — exibida somente agora</p>
          <code className="w-fit rounded-field bg-neutral-0 px-3 py-2 font-mono text-base text-neutral-900 select-all">
            {temporaryPassword}
          </code>
          <p className="text-neutral-600">Copie e repasse ao usuário por um canal seguro. Ela não será mostrada de novo.</p>
        </div>
      )}
    </div>
  )
}
