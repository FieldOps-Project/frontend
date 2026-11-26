const ENTRY_START = /^\s*([A-Za-z][A-Za-z0-9_]*)=/
const EMPTY_VALUES = new Set(['', 'null'])

type Entries = Record<string, string>

function parseJsonObject(raw: string): Entries | null {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null
    return Object.fromEntries(
      Object.entries(parsed).flatMap(([key, value]) =>
        value === null || value === undefined ? [] : [[key, typeof value === 'object' ? JSON.stringify(value) : String(value)]],
      ),
    )
  } catch {
    return null
  }
}

function parsePairs(raw: string): Entries {
  const entries: Entries = {}
  let current: string | null = null

  for (const segment of raw.split(';')) {
    const start = ENTRY_START.exec(segment)
    if (start) {
      current = start[1] as string
      entries[current] = segment.slice(start[0].length)
    } else if (current !== null) {
      entries[current] += `;${segment}`
    }
  }

  return entries
}

export function parseAuditValues(raw: string | null | undefined): Record<string, string> {
  const text = raw?.trim()
  if (!text) return {}

  const entries = (text.startsWith('{') ? parseJsonObject(text) : null) ?? parsePairs(text)

  return Object.fromEntries(
    Object.entries(entries).flatMap(([key, value]) => {
      const trimmed = value.trim()
      return EMPTY_VALUES.has(trimmed) ? [] : [[key, trimmed]]
    }),
  )
}
