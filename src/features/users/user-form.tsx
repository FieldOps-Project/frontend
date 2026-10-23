'use client'

import { useActionState } from 'react'

import { FormAlert, FormFooter } from '@/components/ui/form-actions'
import { FormSection, SelectField, TextField } from '@/components/ui/form-fields'
import { PasswordField } from '@/components/ui/password-field'
import {
  ASSIGNABLE_USER_ROLES,
  USER_ROLE_LABELS,
  USER_STATUS_LABELS,
  USER_STATUSES,
  type User,
} from '@/lib/domain/user'
import { errorOf, IDLE, valueOf, type FormState } from '@/lib/form-state'

export function UserForm({
  action,
  user,
  submitLabel,
}: {
  action: (previous: FormState, formData: FormData) => Promise<FormState>
  user?: User
  submitLabel: string
}) {
  const [state, formAction] = useActionState(action, IDLE)

  /** Perfil fora da lista de atribuiveis (CLIENT_VIEWER) continua selecionavel para nao ser trocado sem querer. */
  const roles = user && !ASSIGNABLE_USER_ROLES.includes(user.role) ? [...ASSIGNABLE_USER_ROLES, user.role] : ASSIGNABLE_USER_ROLES

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <FormAlert state={state} />

      <FormSection title="Dados do usuário">
        <TextField
          name="name"
          label="Nome"
          required
          maxLength={255}
          defaultValue={valueOf(state, 'name', user?.name)}
          error={errorOf(state, 'name')}
        />
        <TextField
          name="email"
          label="E-mail"
          type="email"
          required
          maxLength={320}
          autoComplete="off"
          defaultValue={valueOf(state, 'email', user?.email)}
          error={errorOf(state, 'email')}
        />
        <TextField
          name="phone"
          label="Telefone"
          type="tel"
          maxLength={32}
          defaultValue={valueOf(state, 'phone', user?.phone)}
          error={errorOf(state, 'phone')}
        />
        <SelectField
          name="role"
          label="Perfil"
          required
          placeholder="Selecione o perfil"
          options={roles.map((value) => ({ value, label: USER_ROLE_LABELS[value] }))}
          defaultValue={valueOf(state, 'role', user?.role)}
          error={errorOf(state, 'role')}
          hint="Técnicos usam o aplicativo; o painel é de administradores e supervisores."
        />
      </FormSection>

      {!user && (
        <FormSection title="Acesso">
          <PasswordField
            name="password"
            label="Senha inicial"
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            hint="Mínimo de 8 caracteres. Repasse ao usuário por um canal seguro."
            error={errorOf(state, 'password')}
          />
          <SelectField
            name="status"
            label="Situação inicial"
            options={USER_STATUSES.map((value) => ({ value, label: USER_STATUS_LABELS[value] }))}
            defaultValue={valueOf(state, 'status', 'ACTIVE')}
            error={errorOf(state, 'status')}
          />
        </FormSection>
      )}

      <FormFooter submitLabel={submitLabel} cancelHref="/users" />
    </form>
  )
}
