'use client'

import { useActionState } from 'react'

import { FormAlert, FormFooter } from '@/components/ui/form-actions'
import { FormSection, TextField } from '@/components/ui/form-fields'
import { formatDocument, type Client } from '@/lib/domain/client'
import { errorOf, IDLE, valueOf, type FormState } from '@/lib/form-state'

export function ClientForm({
  action,
  client,
  submitLabel,
}: {
  action: (previous: FormState, formData: FormData) => Promise<FormState>
  client?: Client
  submitLabel: string
}) {
  const [state, formAction] = useActionState(action, IDLE)

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <FormAlert state={state} />

      <FormSection title="Identificação" description="Somente o nome é obrigatório.">
        <TextField
          name="name"
          label="Nome"
          required
          maxLength={255}
          defaultValue={valueOf(state, 'name', client?.name)}
          error={errorOf(state, 'name')}
        />
        <TextField
          name="legalName"
          label="Razão social"
          maxLength={255}
          defaultValue={valueOf(state, 'legalName', client?.legalName)}
          error={errorOf(state, 'legalName')}
        />
        <TextField
          name="document"
          label="CPF ou CNPJ"
          maxLength={18}
          inputMode="numeric"
          placeholder="12.345.678/0001-90"
          hint="Com ou sem máscara. É gravado só com os dígitos."
          defaultValue={valueOf(state, 'document', formatDocument(client?.document ?? null))}
          error={errorOf(state, 'document')}
        />
      </FormSection>

      <FormSection title="Contato">
        <TextField
          name="email"
          label="E-mail"
          type="email"
          maxLength={320}
          defaultValue={valueOf(state, 'email', client?.email)}
          error={errorOf(state, 'email')}
        />
        <TextField
          name="phone"
          label="Telefone"
          type="tel"
          maxLength={32}
          placeholder="+55 11 99999-0000"
          defaultValue={valueOf(state, 'phone', client?.phone)}
          error={errorOf(state, 'phone')}
        />
      </FormSection>

      <FormFooter submitLabel={submitLabel} cancelHref="/clients" />
    </form>
  )
}
