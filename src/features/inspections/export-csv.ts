import { INSPECTION_STATUS_LABELS } from '@/lib/domain/inspection'
import { dayInSaoPaulo, daysOverdue, type InspectionListItem } from '@/lib/domain/inspection-list'
import { INSPECTION_PRIORITY_LABELS } from '@/lib/domain/inspection-scheduling'
import { formatDate, formatDateTime } from '@/lib/format'

const HEADER = [
  'Código',
  'Título',
  'Cliente',
  'Local',
  'Equipamento',
  'Técnico',
  'Prioridade',
  'Estado',
  'Itens respondidos',
  'Itens aplicáveis',
  'Data prevista',
  'Dias de atraso',
  'Atualizada em',
]

/**
 * Celula de CSV. Aspas e separador sao escapados; texto que comeca com `=`,
 * `+`, `-` ou `@` ganha um apostrofo, para que a planilha nao o execute como
 * formula (injecao de formula em CSV).
 */
export function csvCell(value: string | number | null): string {
  if (value === null) return ''
  let text = String(value)
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[;"\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

/**
 * Exportacao das inspecoes filtradas (issue #30). Separador `;` e BOM UTF-8:
 * e o que o Excel em portugues abre direto, com acentos e sem juntar colunas.
 */
export function inspectionsToCsv(items: readonly InspectionListItem[], today: string): string {
  const rows = items.map((item) => [
    item.code,
    item.title,
    item.clientName,
    item.siteName,
    item.equipmentName,
    item.technicianName ?? 'Não atribuído',
    INSPECTION_PRIORITY_LABELS[item.priority],
    INSPECTION_STATUS_LABELS[item.status],
    item.answeredItems,
    item.applicableItems,
    formatDate(dayInSaoPaulo(item.scheduledFor)),
    daysOverdue(item, today),
    formatDateTime(item.updatedAt),
  ])

  return toCsv(HEADER, rows)
}

/** Planilha com cabecalho, separador `;` e BOM UTF-8. */
export function toCsv(header: readonly string[], rows: readonly (readonly (string | number | null)[])[]): string {
  return `﻿${[header, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n')}\r\n`
}
