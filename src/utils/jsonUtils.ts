export type ParseResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string; line?: number; col?: number }

export function parseJSON(raw: string): ParseResult {
  const trimmed = raw.trim()
  if (!trimmed) return { ok: false, error: 'JSON boş olamaz.' }
  try {
    const data = JSON.parse(trimmed)
    return { ok: true, data }
  } catch (e) {
    const msg = (e as SyntaxError).message
    // Extract line/col from common V8 error messages: "at position N"
    const posMatch = msg.match(/position (\d+)/)
    if (posMatch) {
      const pos = parseInt(posMatch[1], 10)
      const before = trimmed.slice(0, pos)
      const line = before.split('\n').length
      const col = before.length - before.lastIndexOf('\n')
      return { ok: false, error: msg, line, col }
    }
    return { ok: false, error: msg }
  }
}

/** Normalize any JSON value into an array of flat-ish row objects. */
export function normalizeToRows(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data.map((item, i) =>
      typeof item === 'object' && item !== null
        ? (item as Record<string, unknown>)
        : { value: item, _index: i }
    )
  }
  if (typeof data === 'object' && data !== null) {
    // Single object → one row
    return [data as Record<string, unknown>]
  }
  return [{ value: data }]
}

/** Collect all unique keys from an array of row objects (preserves insertion order). */
export function collectColumns(rows: Record<string, unknown>[]): string[] {
  const seen = new Set<string>()
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      seen.add(key)
    }
  }
  return Array.from(seen)
}

/** Return true if value is a nested object or array that should be rendered as a popup button. */
export function isNested(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === 'object'
  )
}

export function formatCellValue(value: unknown): string {
  if (value === null) return 'null'
  if (value === undefined) return ''
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'object') return Array.isArray(value) ? `[Array ${(value as unknown[]).length}]` : `{Object}`
  return String(value)
}
