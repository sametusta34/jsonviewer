export type ParseResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string; line?: number; col?: number }

const MAX_NESTING_DEPTH = 100

/** Validate nesting depth to prevent DoS attacks */
function validateNestingDepth(obj: unknown, depth = 0): boolean {
  if (depth > MAX_NESTING_DEPTH) return false
  if (obj === null || typeof obj !== 'object') return true
  if (Array.isArray(obj)) {
    return obj.every(item => validateNestingDepth(item, depth + 1))
  }
  return Object.values(obj as Record<string, unknown>).every(
    v => validateNestingDepth(v, depth + 1)
  )
}

export function parseJSON(raw: string): ParseResult {
  const trimmed = raw.trim()
  if (!trimmed) return { ok: false, error: 'JSON boş olamaz.' }
  try {
    const data = JSON.parse(trimmed)

    // Validate nesting depth
    if (!validateNestingDepth(data)) {
      return { ok: false, error: `JSON yapısı çok iç içe (max: ${MAX_NESTING_DEPTH} level)` }
    }

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

export function formatValueWithColons(value: unknown, depth = 0): string {
  if (value === null) return 'null'
  if (value === undefined) return ''
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return `"${value}"`

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    const items = value.slice(0, 5).map(v => formatValueWithColons(v, depth + 1)).join(', ')
    const suffix = value.length > 5 ? `, ... (${value.length - 5} more)` : ''
    return `[${items}${suffix}]`
  }

  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>
    const keys = Object.keys(obj).slice(0, 5)
    if (keys.length === 0) return '{}'
    const pairs = keys.map(k => `${k}: ${formatValueWithColons(obj[k], depth + 1)}`).join(', ')
    const suffix = Object.keys(obj).length > 5 ? `, ... (${Object.keys(obj).length - 5} more)` : ''
    return `{${pairs}${suffix}}`
  }

  return String(value)
}
