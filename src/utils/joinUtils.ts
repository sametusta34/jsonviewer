export function joinTables(
  leftTable: Record<string, unknown>[],
  rightTable: Record<string, unknown>[],
  leftKey: string,
  rightKey: string,
  rightPrefix: string
): Record<string, unknown>[] {
  const rightMap = new Map<unknown, Record<string, unknown>[]>()

  // Group rightTable by rightKey for efficient lookup
  rightTable.forEach(row => {
    const key = row[rightKey]
    if (!rightMap.has(key)) {
      rightMap.set(key, [])
    }
    rightMap.get(key)!.push(row)
  })

  const result: Record<string, unknown>[] = []

  leftTable.forEach(leftRow => {
    const leftKeyValue = leftRow[leftKey]
    const matchedRightRows = rightMap.get(leftKeyValue) || [{ __no_match: true }]

    matchedRightRows.forEach(rightRow => {
      const mergedRow: Record<string, unknown> = { ...leftRow }

      if ('__no_match' in rightRow) {
        // No matching right row - add nulls for all right columns
        rightTable[0] && Object.keys(rightTable[0]).forEach(key => {
          if (key !== rightKey || rightKey === leftKey) {
            mergedRow[`${rightPrefix}${key}`] = null
          }
        })
      } else {
        // Merge right row with prefix
        Object.entries(rightRow).forEach(([key, value]) => {
          const prefixedKey = `${rightPrefix}${key}`
          mergedRow[prefixedKey] = value
        })
      }

      result.push(mergedRow)
    })
  })

  return result
}

export function getObjectKeys(data: unknown): string[] {
  if (typeof data !== 'object' || !data || Array.isArray(data)) return []
  return Object.keys(data as Record<string, unknown>)
}

export function isArrayOfObjects(data: unknown): boolean {
  return (
    Array.isArray(data) &&
    data.length > 0 &&
    typeof data[0] === 'object' &&
    data[0] !== null &&
    !Array.isArray(data[0])
  )
}
