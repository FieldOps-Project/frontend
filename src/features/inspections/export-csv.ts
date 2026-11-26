export function csvCell(value: string | number | null): string {
  if (value === null) return ''
  let text = String(value)
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[;"\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function toCsv(header: readonly string[], rows: readonly (readonly (string | number | null)[])[]): string {
  return `﻿${[header, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n')}\r\n`
}
