import ExcelJS from 'exceljs'
import { formatCellValue } from './jsonUtils'

/** Prevent CSV injection by escaping formula characters */
function escapeCSVValue(val: string): string {
  // CSV injection: =, +, -, @, tab, carriage return
  if (/^[=+\-@\t\r]/.test(val)) {
    return `'${val}`
  }
  return val
}

export function exportToCSV(
  rows: Record<string, unknown>[],
  columns: string[],
  filename = 'data'
) {
  const header = columns.join(',')
  const lines = rows.map(row =>
    columns
      .map(col => {
        let val = formatCellValue(row[col])
        // Prevent CSV injection
        val = escapeCSVValue(val)
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

export async function exportToExcel(
  rows: Record<string, unknown>[],
  columns: string[],
  filename = 'data'
) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Sheet1')

  // Add header
  worksheet.addRow(columns)

  // Add data rows
  rows.forEach(row => {
    const rowData = columns.map(col => {
      const v = row[col]
      if (v === null || v === undefined) return ''
      if (typeof v === 'object') return JSON.stringify(v)
      return String(v)
    })
    worksheet.addRow(rowData)
  })

  // Style header
  worksheet.getRow(1).font = { bold: true }
  worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } }

  // Auto-fit columns
  columns.forEach((col, idx) => {
    const maxLen = Math.max(col.length, 20)
    worksheet.getColumn(idx + 1).width = Math.min(maxLen, 50)
  })

  // Write file
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  downloadBlob(blob, `${filename}.xlsx`)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
