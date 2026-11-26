'use client'

import Link from 'next/link'
import { useActionState, useEffect, useRef, useState, type FormEvent } from 'react'
import { IoInformationCircleOutline, IoLockClosedOutline, IoPeopleOutline } from 'react-icons/io5'

import { FormAlert, SubmitButton } from '@/components/ui/form-actions'
import { SelectField, TextAreaField, TextField } from '@/components/ui/form-fields'
import { updateInspectionPlanning } from '@/features/inspections/planning-actions'
import {
  firstInvalidPlanningField,
  hasPlanningErrors,
  validatePlanning,
  type PlanningErrors,
  type PlanningField,
} from '@/features/inspections/planning-validation'
import { INSTRUCTIONS_MAX_LENGTH, TITLE_MAX_LENGTH, isPastDate } from '@/features/inspections/schedule-validation'
import { INSPECTION_PRIORITIES, INSPECTION_PRIORITY_LABELS, type InspectionPriority } from '@/lib/domain/inspection-scheduling'
import { errorOf, IDLE, valueOf } from '@/lib/form-state'

type Person = { readonly id: string; readonly name: string }

export type PlanningFormInitial = {
  readonly title: string
  readonly technicianId: string | null
  readonly supervisorId: string | null
  readonly scheduledDate: string
  readonly priority: InspectionPriority
  readonly instructions: string | null
}

export type PlanningFormFixed = {
  readonly template: string
  readonly client: string
  readonly site: string
  readonly equipment: string
}

const SUBMIT =
  'inline-flex h-11 items-center justify-center rounded-field bg-brand-700 px-5 text-sm font-semibold text-neutral-0 transition-colors hover:bg-brand-800 disabled:cursor-wait disabled:opacity-70'

const SECTION = 'flex flex-col gap-6 rounded-card border border-neutral-200 bg-neutral-0 p-6 sm:p-8'
const SECTION_TITLE = 'flex items-center gap-3 border-b border-neutral-200 pb-4 text-lg font-semibold text-neutral-900'

export function PlanningForm({
  inspectionId,
  initial,
  fixed,
  technicians,
  supervisors,
  today,
}: {
  inspectionId: string
  initial: PlanningFormInitial
  fixed: PlanningFormFixed
  technicians: readonly Person[]
  supervisors: readonly Person[]
  today: string
}) {
  const [state, action] = useActionState(updateInspectionPlanning.bind(null, inspectionId), IDLE)
  const [clientErrors, setClientErrors] = useState<PlanningErrors | null>(null)
  const [scheduledDate, setScheduledDate] = useState(() => valueOf(state, 'scheduledDate', initial.scheduledDate))
  const formRef = useRef<HTMLFormElement>(null)

  function errorFor(field: PlanningField): string | undefined {
    return clientErrors ? clientErrors[field] : errorOf(state, field)
  }

  function clearError(field: PlanningField) {
    if (clientErrors?.[field]) setClientErrors({ ...clientErrors, [field]: undefined })
  }

  function focusField(field: PlanningField) {
    formRef.current?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus()
  }

  useEffect(() => {
    if (state.status !== 'error') return
    const invalid = firstInvalidPlanningField(state.fieldErrors as PlanningErrors)
    if (invalid) focusField(invalid)
  }, [state])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget)
    const values = Object.fromEntries(
      [...data.entries()].filter(([, value]) => typeof value === 'string') as [string, string][],
    )
    const found = validatePlanning(values)

    if (hasPlanningErrors(found)) {
      event.preventDefault()
      setClientErrors(found)
      const invalid = firstInvalidPlanningField(found)
      if (invalid) focusField(invalid)
      return
    }
    setClientErrors(null)
  }

  return (
    <form ref={formRef} action={action} onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
      {!clientErrors && <FormAlert state={state} />}

      <section className={SECTION}>
        <h2 className={SECTION_TITLE}>
          <IoLockClosedOutline aria-hidden className="size-6 text-neutral-600" />
          Modelo e local
        </h2>
        <dl className="grid gap-6 md:grid-cols-2">
          {[
            ['Modelo de inspeção', fixed.template],
            ['Cliente', fixed.client],
            ['Local', fixed.site],
            ['Equipamento', fixed.equipment],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1.5">
              <dt className="text-sm font-medium text-neutral-700">{label}</dt>
              <dd className="rounded-field border border-neutral-200 bg-neutral-100 px-3 py-2 text-sm text-neutral-700">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm text-neutral-600">
          Para trocar o modelo, o cliente, o local ou o equipamento, cancele esta inspeção e agende outra.
        </p>
      </section>

      <section className={SECTION}>
        <h2 className={SECTION_TITLE}>
          <IoPeopleOutline aria-hidden className="size-6 text-neutral-600" />
          Equipe
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <SelectField
            name="technicianId"
            label="Técnico"
            required
            placeholder="Selecione um técnico ativo"
            options={technicians.map((person) => ({ value: person.id, label: person.name }))}
            defaultValue={valueOf(state, 'technicianId', initial.technicianId)}
            onChange={() => clearError('technicianId')}
            error={errorFor('technicianId')}
          />
          <SelectField
            name="supervisorId"
            label="Supervisor responsável"
            placeholder="Selecione o supervisor"
            options={supervisors.map((person) => ({ value: person.id, label: person.name }))}
            defaultValue={valueOf(state, 'supervisorId', initial.supervisorId)}
            onChange={() => clearError('supervisorId')}
            error={errorFor('supervisorId')}
          />
        </div>
      </section>

      <section className={SECTION}>
        <h2 className={SECTION_TITLE}>
          <IoInformationCircleOutline aria-hidden className="size-6 text-neutral-600" />
          Detalhes da execução
        </h2>
        <TextField
          name="title"
          label="Título"
          required
          maxLength={TITLE_MAX_LENGTH}
          defaultValue={valueOf(state, 'title', initial.title)}
          onChange={() => clearError('title')}
          error={errorFor('title')}
        />
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
                A data escolhida já passou. Confira antes de salvar.
              </p>
            )}
          </div>
          <SelectField
            name="priority"
            label="Prioridade"
            required
            options={INSPECTION_PRIORITIES.map((priority) => ({ value: priority, label: INSPECTION_PRIORITY_LABELS[priority] }))}
            defaultValue={valueOf(state, 'priority', initial.priority)}
            error={errorFor('priority')}
          />
        </div>
        <TextAreaField
          name="instructions"
          label="Instruções"
          rows={4}
          maxLength={INSTRUCTIONS_MAX_LENGTH}
          placeholder="Adicione instruções específicas para o técnico..."
          defaultValue={valueOf(state, 'instructions', initial.instructions)}
          error={errorFor('instructions')}
        />
      </section>

      <div className="flex flex-wrap items-center justify-end gap-6 border-t border-neutral-200 pt-6">
        <Link href={`/inspections/${inspectionId}`} className="text-sm font-medium text-brand-700 hover:text-brand-800 hover:underline">
          Cancelar
        </Link>
        <SubmitButton pendingLabel="Salvando…" className={SUBMIT}>
          Salvar planejamento
        </SubmitButton>
      </div>
    </form>
  )
}
