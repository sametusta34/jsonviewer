import * as XLSX from 'xlsx'
import { formatCellValue } from './jsonUtils'

export function exportToCSV(
  rows: Record<string, unknown>[],
  columns: string[],
  filename = 'data'
) {
  const header = columns.join(',')
  const lines = rows.map(row =>
    columns
      .map(col => {
        const val = formatCellValue(row[col])
        // Escape for CSV
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`
        }
        return val
      })
      .join(',')
  )
  const csv = [header, ...lines].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, `${filename}.csv`)
}

export function exportToExcel(
  rows: Record<string, unknown>[],
  columns: string[],
  filename = 'data'
) {
  const wsData = [
    columns,
    ...rows.map(row => columns.map(col => {
      const v = row[col]
      if (v === null || v === undefined) return ''
      if (typeof v === 'object') return JSON.stringify(v)
      return v
    })),
  ]
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
