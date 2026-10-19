'use client'

import { useActionState } from 'react'

import { FormAlert, FormFooter } from '@/components/ui/form-actions'
import { FormSection, SelectField, TextAreaField, TextField, type SelectOption } from '@/components/ui/form-fields'
import type { Site } from '@/lib/domain/site'
import { errorOf, IDLE, valueOf, type FormState } from '@/lib/form-state'

export function SiteForm({
  action,
  site,
  clientOptions,
  clientName,
  defaultClientId,
  submitLabel,
}: {
  action: (previous: FormState, formData: FormData) => Promise<FormState>
  site?: Site
  /** Somente clientes ativos. Ausente na edicao, quando o cliente e fixo. */
  clientOptions?: readonly SelectOption[]
  clientName?: string
  defaultClientId?: string
  submitLabel: string
}) {
  const [state, formAction] = useActionState(action, IDLE)
  const coordinate = (value: number | null | undefined) => (value === null || value === undefined ? '' : String(value))

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <FormAlert state={state} />

      <FormSection title="Identificação">
        {clientOptions ? (
          <SelectField
            name="clientId"
            label="Cliente"
            required
            placeholder="Selecione o cliente"
            options={clientOptions}
            defaultValue={valueOf(state, 'clientId', defaultClientId)}
            error={errorOf(state, 'clientId')}
            hint="Somente clientes ativos. Não poderá ser alterado depois."
          />
        ) : (
          <TextField
            name="clientName"
            label="Cliente"
            value={clientName ?? ''}
            disabled
            readOnly
            hint="O cliente de um local não pode ser alterado."
          />
        )}
        <TextField
          name="name"
          label="Nome do local"
          required
          maxLength={255}
          placeholder="Unidade Sorocaba"
          defaultValue={valueOf(state, 'name', site?.name)}
          error={errorOf(state, 'name')}
        />
        <TextAreaField
          name="description"
          label="Descrição"
          maxLength={1000}
          className="md:col-span-2"
          defaultValue={valueOf(state, 'description', site?.description)}
          error={errorOf(state, 'description')}
        />
      </FormSection>

      <FormSection title="Endereço">
        <TextField
          name="addressLine"
          label="Endereço"
          maxLength={255}
          className="md:col-span-2"
          defaultValue={valueOf(state, 'addressLine', site?.addressLine)}
          error={errorOf(state, 'addressLine')}
        />
        <TextField
          name="city"
          label="Cidade"
          maxLength={100}
          defaultValue={valueOf(state, 'city', site?.city)}
          error={errorOf(state, 'city')}
        />
        <TextField
          name="state"
          label="Estado"
          maxLength={100}
          placeholder="SP"
          defaultValue={valueOf(state, 'state', site?.state)}
          error={errorOf(state, 'state')}
        />
        <TextField
          name="postalCode"
          label="CEP"
          maxLength={20}
          placeholder="18000-000"
          defaultValue={valueOf(state, 'postalCode', site?.postalCode)}
          error={errorOf(state, 'postalCode')}
        />
      </FormSection>

      <FormSection
        title="Coordenadas do endereço"
        description="Opcionais, mas informadas em conjunto. Referem-se ao endereço cadastrado, não à localização capturada pelo técnico."
      >
        <TextField
          name="latitude"
          label="Latitude"
          type="number"
          step="any"
          min={-90}
          max={90}
          placeholder="-23.5015"
          defaultValue={valueOf(state, 'latitude', coordinate(site?.latitude))}
          error={errorOf(state, 'latitude')}
        />
        <TextField
          name="longitude"
          label="Longitude"
          type="number"
          step="any"
          min={-180}
          max={180}
          placeholder="-47.4526"
          defaultValue={valueOf(state, 'longitude', coordinate(site?.longitude))}
          error={errorOf(state, 'longitude')}
        />
      </FormSection>

      <FormSection title="Contato no local">
        <TextField
          name="contactName"
          label="Nome do contato"
          maxLength={255}
          defaultValue={valueOf(state, 'contactName', site?.contactName)}
          error={errorOf(state, 'contactName')}
        />
        <TextField
          name="contactPhone"
          label="Telefone do contato"
          type="tel"
          maxLength={32}
          defaultValue={valueOf(state, 'contactPhone', site?.contactPhone)}
          error={errorOf(state, 'contactPhone')}
        />
      </FormSection>

      <FormFooter submitLabel={submitLabel} cancelHref="/sites" />
    </form>
  )
}
