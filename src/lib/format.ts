/**
 * Datas sempre no fuso da operacao. O servidor do Next roda em UTC dentro do
 * container; sem fuso explicito, uma inspecao das 22h apareceria no dia seguinte.
 */
const TIME_ZONE = 'America/Sao_Paulo'

const DATE_TIME = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: TIME_ZONE,
})

const DATE = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'UTC' })

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : DATE_TIME.format(date)
}

/** Data sem horario (`2026-01-15`), lida em UTC para nao voltar um dia. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? '—' : DATE.format(date)
}

export function orDash(value: string | null | undefined): string {
  return value && value.trim() !== '' ? value : '—'
}
