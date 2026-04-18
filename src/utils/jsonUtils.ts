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

/** Convert JSON data to key-value pair rows for row-by-row display. */
export function normalizeToRows(data: unknown): Array<{ key: string; value: unknown }> {
  if (Array.isArray(data)) {
    // For arrays, show each item as a separate row with index as key
    return data.map((item, i) => ({
      key: `[${i}]`,
      value: item,
    }))
  }
  if (typeof data === 'object' && data !== null) {
    // For objects, flatten to key-value rows
    return Object.entries(data as Record<string, unknown>).map(([key, value]) => ({
      key,
      value,
    }))
  }
  // For primitives, show as single row
  return [{ key: 'value', value: data }]
}

/** Get columns for key-value display. */
export function collectColumns(): string[] {
  return ['key', 'value']
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
