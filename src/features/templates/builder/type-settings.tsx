'use client'

import { MdAdd, MdClose } from 'react-icons/md'

import { BUILDER_LIMITS, type ResponseType } from '@/lib/domain/template-builder'

const CHIP = 'flex items-center gap-2.5 rounded-sm bg-neutral-0 px-3 py-2.5 text-sm font-medium text-neutral-900'

function Choice({ label, dot, failure = false }: { label: string; dot: string; failure?: boolean }) {
  return (
    <li className={`${CHIP} ${failure ? 'border border-danger/40 text-danger' : 'border border-transparent'}`}>
      <span aria-hidden className={`size-3 shrink-0 rounded-full ${dot}`} />
      {label}
      {failure && <span className="sr-only">(resposta de falha)</span>}
    </li>
  )
}

/** Como o tecnico responde nos tipos sem configuracao extra. */
const ANSWER_HINTS: Partial<Record<ResponseType, string>> = {
  TEXT_SHORT: 'O técnico responde em uma linha de texto.',
  TEXT_LONG: 'O técnico responde em texto livre, com várias linhas.',
  NUMBER: 'O técnico informa um número.',
  DATE: 'O técnico escolhe uma data no calendário.',
}

/**
 * Previa das respostas do tipo, a caixa cinza do desenho do construtor. Na
 * conformidade e no sim/nao a resposta de falha aparece destacada, porque e
 * ela que dispara as exigencias de observacao e evidencia.
 */
export function AnswerPreview({ type }: { type: ResponseType }) {
  if (type === 'CONFORMITY') {
    return (
      <ul aria-label="Respostas possíveis" className="grid gap-3 sm:grid-cols-2">
        <Choice label="Conforme (C)" dot="bg-success" />
        <Choice label="Não Conforme (NC)" dot="bg-danger" failure />
        <Choice label="Não Aplicável (NA)" dot="bg-tertiary-300" />
      </ul>
    )
  }

  if (type === 'BOOLEAN') {
    return (
      <ul aria-label="Respostas possíveis" className="grid gap-3 sm:grid-cols-2">
        <Choice label="Sim" dot="bg-success" />
        <Choice label="Não" dot="bg-danger" failure />
      </ul>
    )
  }

  const hint = ANSWER_HINTS[type]
  return hint ? <p className="text-sm text-neutral-600">{hint}</p> : null
}

/**
 * Opcoes da escolha unica: ao menos duas, sem repetir, ate o limite da API. A
 * remocao para em duas linhas, o minimo que o item precisa para ser salvo.
 */
export function OptionsEditor({
  idPrefix,
  options,
  error,
  onChange,
}: {
  idPrefix: string
  options: readonly string[]
  error?: string
  onChange: (options: readonly string[]) => void
}) {
  const rows = options.length >= 2 ? options : [...options, ...Array.from({ length: 2 - options.length }, () => '')]

  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-1 text-sm font-medium text-neutral-800">Opções de resposta</legend>
      {rows.map((option, index) => (
        <div key={index} className="flex items-center gap-2">
          <label htmlFor={index === 0 ? `${idPrefix}-options` : `${idPrefix}-option-${index}`} className="sr-only">
            Opção {index + 1}
          </label>
          <input
            id={index === 0 ? `${idPrefix}-options` : `${idPrefix}-option-${index}`}
            value={option}
            maxLength={BUILDER_LIMITS.option}
            placeholder={`Opção ${index + 1}`}
            aria-invalid={error ? true : undefined}
            onChange={(event) => onChange(rows.map((current, i) => (i === index ? event.target.value : current)))}
            className="h-10 min-w-0 flex-1 rounded-md border border-neutral-300 bg-neutral-0 px-3 text-sm text-neutral-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 aria-[invalid=true]:border-danger"
          />
          <button
            type="button"
            onClick={() => onChange(rows.filter((_, i) => i !== index))}
            disabled={rows.length <= 2}
            aria-label={`Remover a opção ${index + 1}`}
            className="grid size-9 shrink-0 place-items-center rounded-md text-neutral-500 hover:bg-neutral-0 hover:text-danger disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-neutral-500"
          >
            <MdClose aria-hidden className="size-5" />
          </button>
        </div>
      ))}
      {error && <p className="text-sm text-danger">{error}</p>}
      {rows.length < BUILDER_LIMITS.options && (
        <button
          type="button"
          onClick={() => onChange([...rows, ''])}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          <MdAdd aria-hidden className="size-5" />
          Adicionar opção
        </button>
      )}
    </fieldset>
  )
}
