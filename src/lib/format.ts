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

const DAY = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE })
const TIME = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TIME_ZONE })
const LONG_DATE = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TIME_ZONE })

/**
 * Data de registro recente: "Hoje, 09:45", "Ontem" ou "24 de out. de 2023".
 * Hoje e ontem sao os do fuso da operacao, nao os do servidor.
 */
export function formatRecentDate(value: string | null | undefined, now: Date = new Date()): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  const day = DAY.format(date)
  if (day === DAY.format(now)) return `Hoje, ${TIME.format(date)}`
  if (day === DAY.format(new Date(now.getTime() - 86_400_000))) return 'Ontem'
  return LONG_DATE.format(date)
}
