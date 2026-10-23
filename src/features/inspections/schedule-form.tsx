'use client'

import Link from 'next/link'
import { useActionState, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { IoBusinessOutline, IoClipboardOutline, IoInformationCircleOutline, IoPeopleOutline } from 'react-icons/io5'

import { FormAlert, SubmitButton } from '@/components/ui/form-actions'
import { SelectField, TextAreaField, TextField, type SelectOption } from '@/components/ui/form-fields'
import { Notice } from '@/components/ui/notice'
import { createInspection } from '@/features/inspections/schedule-actions'
import {
  INSTRUCTIONS_MAX_LENGTH,
  firstInvalidField,
  hasScheduleErrors,
  isPastDate,
  validateSchedule,
  type ScheduleErrors,
  type ScheduleField,
} from '@/features/inspections/schedule-validation'
import {
  DEFAULT_INSPECTION_PRIORITY,
  INSPECTION_PRIORITIES,
  INSPECTION_PRIORITY_LABELS,
  templateVersionLabel,
  type PublishedTemplateVersion,
} from '@/lib/domain/inspection-scheduling'
import { errorOf, IDLE, valueOf } from '@/lib/form-state'

export type ScheduleCatalog = {
  readonly templates: readonly PublishedTemplateVersion[]
  readonly clients: readonly { readonly id: string; readonly name: string }[]
  readonly sites: readonly { readonly id: string; readonly clientId: string; readonly name: string; readonly city: string | null }[]
  readonly equipment: readonly { readonly id: string; readonly siteId: string; readonly name: string; readonly assetNumber: string | null }[]
  readonly technicians: readonly { readonly id: string; readonly name: string }[]
  readonly supervisors: readonly { readonly id: string; readonly name: string }[]
}

const SUBMIT =
  'inline-flex h-11 items-center justify-center rounded-field bg-brand-700 px-5 text-sm font-semibold text-neutral-0 transition-colors hover:bg-brand-800 disabled:cursor-wait disabled:opacity-70'

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-6 rounded-card border border-neutral-200 bg-neutral-0 p-6 sm:p-8">
      <h2 className="flex items-center gap-3 border-b border-neutral-200 pb-4 text-lg font-semibold text-neutral-900">
        <span aria-hidden className="text-neutral-600 [&>svg]:size-6">
          {icon}
        </span>
        {title}
      </h2>
      {children}
    </section>
  )
}

/**
 * Agendamento de inspecao (issue #16 e documento 14.9).
 *
 * Cliente, local e equipamento sao encadeados: trocar o cliente limpa local e
 * equipamento, trocar o local limpa o equipamento -- sem isso o formulario
 * manteria um equipamento de outro local e a API recusaria com um erro sem
 * sentido para quem esta agendando. So registros ativos chegam aos seletores.
 * O equipamento passa a ser obrigatorio quando o modelo inspeciona um (RN-026).
 *
 * O seletor dependente fica desabilitado ate o pai ser escolhido, e avisa
 * quando o pai nao tem registros ativos, em vez de abrir uma lista vazia.
 */
export function ScheduleForm({ catalog, today }: { catalog: ScheduleCatalog; today: string }) {
  const [state, action] = useActionState(createInspection, IDLE)
  const [clientErrors, setClientErrors] = useState<ScheduleErrors | null>(null)
  const [templateId, setTemplateId] = useState(() => valueOf(state, 'templateVersionId', ''))
  const [clientId, setClientId] = useState(() => valueOf(state, 'clientId', ''))
  const [siteId, setSiteId] = useState(() => valueOf(state, 'siteId', ''))
  const [equipmentId, setEquipmentId] = useState(() => valueOf(state, 'equipmentId', ''))
  const [scheduledDate, setScheduledDate] = useState(() => valueOf(state, 'scheduledDate', ''))
  const formRef = useRef<HTMLFormElement>(null)

  const template = catalog.templates.find((candidate) => candidate.versionId === templateId)
  const requiresEquipment = template?.requiresEquipment ?? false
  const sites = catalog.sites.filter((site) => site.clientId === clientId)
  const equipment = catalog.equipment.filter((item) => item.siteId === siteId)

  function errorFor(field: ScheduleField): string | undefined {
    return clientErrors ? clientErrors[field] : errorOf(state, field)
  }

  function clearError(field: ScheduleField) {
    if (clientErrors?.[field]) setClientErrors({ ...clientErrors, [field]: undefined })
  }

  function focusField(field: ScheduleField) {
    formRef.current?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus()
  }

  useEffect(() => {
    if (state.status !== 'error') return
    const invalid = firstInvalidField(state.fieldErrors as ScheduleErrors)
    if (invalid) focusField(invalid)
  }, [state])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget)
    const values = Object.fromEntries(
      [...data.entries()].filter(([, value]) => typeof value === 'string') as [string, string][],
    )
    const found = validateSchedule(values, { requiresEquipment })

    if (hasScheduleErrors(found)) {
      event.preventDefault()
      setClientErrors(found)
      const invalid = firstInvalidField(found)
      if (invalid) focusField(invalid)
      return
    }
    setClientErrors(null)
  }

  const templateOptions: SelectOption[] = catalog.templates.map((version) => ({
    value: version.versionId,
    label: templateVersionLabel(version),
  }))

  return (
    <form ref={formRef} action={action} onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
      {!clientErrors && <FormAlert state={state} />}
      {state.status === 'success' && <Notice tone="success">{state.message}</Notice>}

      <Section icon={<IoClipboardOutline />} title="Seleção do modelo">
        <SelectField
          name="templateVersionId"
          label="Modelo de inspeção"
          required
          className="md:w-1/2"
          placeholder="Selecione um modelo publicado"
          options={templateOptions}
          value={templateId}
          onChange={(event) => {
            setTemplateId(event.target.value)
            clearError('templateVersionId')
            clearError('equipmentId')
          }}
          error={errorFor('templateVersionId')}
          hint={catalog.templates.length === 0 ? 'Nenhuma versão publicada disponível para novas inspeções.' : undefined}
        />
      </Section>

      <Section icon={<IoBusinessOutline />} title="Atribuição de entidades">
        <div className="grid gap-6 md:grid-cols-2">
          <SelectField
            name="clientId"
            label="Cliente"
            required
            placeholder="Selecione o cliente"
            options={catalog.clients.map((client) => ({ value: client.id, label: client.name }))}
            value={clientId}
            onChange={(event) => {
              setClientId(event.target.value)
              setSiteId('')
              setEquipmentId('')
              clearError('clientId')
            }}
            error={errorFor('clientId')}
          />
          <SelectField
            name="siteId"
            label="Local"
            required
            placeholder="Selecione o local (filtrado pelo cliente)"
            options={sites.map((site) => ({ value: site.id, label: [site.name, site.city].filter(Boolean).join(' — ') }))}
            value={siteId}
            disabled={!clientId}
            hint={clientId && sites.length === 0 ? 'Este cliente não tem locais ativos.' : undefined}
            onChange={(event) => {
              setSiteId(event.target.value)
              setEquipmentId('')
              clearError('siteId')
            }}
            error={errorFor('siteId')}
          />
        </div>
        <SelectField
          name="equipmentId"
          label="Equipamento"
          labelNote={requiresEquipment ? undefined : '(Opcional para inspeções gerais do local)'}
          required={requiresEquipment}
          placeholder="Selecione o equipamento (filtrado pelo local)"
          options={equipment.map((item) => ({
            value: item.id,
            label: item.assetNumber ? `${item.name} · ${item.assetNumber}` : item.name,
          }))}
          value={equipmentId}
          disabled={!siteId}
          hint={siteId && equipment.length === 0 ? 'Nenhum equipamento ativo neste local.' : undefined}
          onChange={(event) => {
            setEquipmentId(event.target.value)
            clearError('equipmentId')
          }}
          error={errorFor('equipmentId')}
        />
      </Section>

      <Section icon={<IoPeopleOutline />} title="Equipe">
        <div className="grid gap-6 md:grid-cols-2">
          <SelectField
            name="technicianId"
            label="Técnico"
            required
            placeholder="Selecione um técnico ativo"
            options={catalog.technicians.map((user) => ({ value: user.id, label: user.name }))}
            defaultValue={valueOf(state, 'technicianId', '')}
            onChange={() => clearError('technicianId')}
            error={errorFor('technicianId')}
          />
          <SelectField
            name="supervisorId"
            label="Supervisor responsável"
            placeholder="Selecione o supervisor"
            options={catalog.supervisors.map((user) => ({ value: user.id, label: user.name }))}
            defaultValue={valueOf(state, 'supervisorId', '')}
            onChange={() => clearError('supervisorId')}
            error={errorFor('supervisorId')}
          />
        </div>
      </Section>

      <Section icon={<IoInformationCircleOutline />} title="Detalhes da execução">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <TextField
              name="scheduledDate"
              label="Data prevista"
              type="date"
              required
              value={scheduledDate}
              onChange={(event) => {
                setScheduledDate(event.target.value)
                clearError('scheduledDate')
              }}
              error={errorFor('scheduledDate')}
            />
            {!errorFor('scheduledDate') && isPastDate(scheduledDate, today) && (
              <p role="status" className="text-xs text-warning">
                A data escolhida já passou. Confira antes de criar a inspeção.
              </p>
            )}
          </div>
          <SelectField
            name="priority"
            label="Prioridade"
            options={INSPECTION_PRIORITIES.map((priority) => ({
              value: priority,
              label: INSPECTION_PRIORITY_LABELS[priority],
            }))}
            defaultValue={valueOf(state, 'priority', DEFAULT_INSPECTION_PRIORITY)}
            error={errorFor('priority')}
          />
        </div>
        <TextAreaField
          name="instructions"
          label="Instruções"
          rows={4}
          maxLength={INSTRUCTIONS_MAX_LENGTH}
          placeholder="Adicione instruções específicas para o técnico..."
          defaultValue={valueOf(state, 'instructions', '')}
          error={errorFor('instructions')}
        />
      </Section>

      <div className="flex flex-wrap items-center justify-end gap-6 border-t border-neutral-200 pt-6">
        <Link href="/inspections" className="text-sm font-medium text-brand-700 hover:text-brand-800 hover:underline">
          Cancelar
        </Link>
        <SubmitButton pendingLabel="Criando…" className={SUBMIT}>
          Criar e atribuir
        </SubmitButton>
      </div>
    </form>
  )
}
