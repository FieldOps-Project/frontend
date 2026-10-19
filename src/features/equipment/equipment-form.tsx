'use client'

import { useActionState, useRef, type RefObject } from 'react'
import { IoRefreshOutline } from 'react-icons/io5'

import { FormAlert, FormFooter } from '@/components/ui/form-actions'
import { FormSection, SelectField, TextAreaField, TextField, type SelectGroup } from '@/components/ui/form-fields'
import { BUTTON_SECONDARY } from '@/components/ui/styles'
import { generateQrCode, type Equipment } from '@/lib/domain/equipment'
import { errorOf, IDLE, valueOf, type FormState } from '@/lib/form-state'

export function EquipmentForm({
  action,
  equipment,
  siteGroups,
  siteName,
  defaultSiteId,
  submitLabel,
  cancelHref,
}: {
  action: (previous: FormState, formData: FormData) => Promise<FormState>
  equipment?: Equipment
  /** Somente locais ativos. Ausente na edicao, quando o local e fixo. */
  siteGroups?: readonly SelectGroup[]
  siteName?: string
  defaultSiteId?: string
  submitLabel: string
  cancelHref: string
}) {
  const [state, formAction] = useActionState(action, IDLE)
  const qrRef = useRef<HTMLInputElement>(null)

  /** QR duplicado (409) aparece no campo do QR, com a opcao de gerar outro valor. */
  function regenerate() {
    if (qrRef.current) {
      qrRef.current.value = generateQrCode()
      qrRef.current.focus()
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <FormAlert state={state} />

      <FormSection title="Identificação">
        {siteGroups ? (
          <SelectField
            name="siteId"
            label="Local"
            required
            placeholder="Selecione o local"
            groups={siteGroups}
            defaultValue={valueOf(state, 'siteId', defaultSiteId)}
            error={errorOf(state, 'siteId')}
            hint="Somente locais ativos, agrupados por cliente."
          />
        ) : (
          <TextField name="siteName" label="Local" value={siteName ?? ''} disabled readOnly />
        )}
        <TextField
          name="name"
          label="Nome do equipamento"
          required
          maxLength={255}
          placeholder="Compressor de ar industrial"
          defaultValue={valueOf(state, 'name', equipment?.name)}
          error={errorOf(state, 'name')}
        />
        <TextField
          name="assetNumber"
          label="Patrimônio"
          maxLength={100}
          defaultValue={valueOf(state, 'assetNumber', equipment?.assetNumber)}
          error={errorOf(state, 'assetNumber')}
        />
        <TextField
          name="serialNumber"
          label="Número de série"
          maxLength={100}
          defaultValue={valueOf(state, 'serialNumber', equipment?.serialNumber)}
          error={errorOf(state, 'serialNumber')}
        />
        <TextField
          name="manufacturer"
          label="Fabricante"
          maxLength={255}
          defaultValue={valueOf(state, 'manufacturer', equipment?.manufacturer)}
          error={errorOf(state, 'manufacturer')}
        />
        <TextField
          name="model"
          label="Modelo"
          maxLength={255}
          defaultValue={valueOf(state, 'model', equipment?.model)}
          error={errorOf(state, 'model')}
        />
        <TextField
          name="installedAt"
          label="Data de instalação"
          type="date"
          defaultValue={valueOf(state, 'installedAt', equipment?.installedAt)}
          error={errorOf(state, 'installedAt')}
        />
        <TextAreaField
          name="description"
          label="Descrição"
          maxLength={1000}
          className="md:col-span-2"
          defaultValue={valueOf(state, 'description', equipment?.description)}
          error={errorOf(state, 'description')}
        />
      </FormSection>

      <FormSection
        title="QR Code"
        description="Valor impresso na etiqueta e lido pelo aplicativo. É um código opaco: não leva dados do equipamento."
      >
        <div className="flex items-end gap-2 md:col-span-2">
          <div className="flex-1">
            <QrInput
              inputRef={qrRef}
              defaultValue={valueOf(state, 'qrCode', equipment?.qrCode)}
              error={errorOf(state, 'qrCode')}
              required={Boolean(equipment)}
            />
          </div>
          <button type="button" onClick={regenerate} className={`${BUTTON_SECONDARY} mb-[1.375rem]`}>
            <IoRefreshOutline aria-hidden className="size-4" />
            Gerar outro
          </button>
        </div>
      </FormSection>

      <FormFooter submitLabel={submitLabel} cancelHref={cancelHref} />
    </form>
  )
}

function QrInput({
  inputRef,
  defaultValue,
  error,
  required,
}: {
  inputRef: RefObject<HTMLInputElement | null>
  defaultValue: string
  error: string | undefined
  required: boolean
}) {
  const hintId = 'field-qrCode-hint'
  const errorId = 'field-qrCode-error'

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="field-qrCode" className="text-sm font-medium text-neutral-700">
        Valor do QR Code
      </label>
      <input
        ref={inputRef}
        id="field-qrCode"
        name="qrCode"
        maxLength={255}
        required={required}
        defaultValue={defaultValue}
        placeholder="Gerado automaticamente se ficar em branco"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : hintId}
        className="w-full rounded-field border border-neutral-200 bg-neutral-0 px-3 py-2 font-mono text-sm text-neutral-900 placeholder:font-sans placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none aria-[invalid=true]:border-danger"
      />
      {error ? (
        <p id={errorId} className="text-xs text-danger">
          {error}
        </p>
      ) : (
        <p id={hintId} className="text-xs text-neutral-500">
          Precisa ser único entre todos os equipamentos.
        </p>
      )}
    </div>
  )
}
