import { useEffect, useRef, useCallback } from 'react'
import { X, Download, FileText, FileSpreadsheet } from 'lucide-react'
import DataTable from './DataTable'
import { normalizeToRows, formatCellValue } from '../utils/jsonUtils'
import { exportToCSV, exportToExcel } from '../utils/exportUtils'

interface Props {
  title: string
  data: unknown
  onClose: () => void
}

export default function NestedModal({ title, data, onClose }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const rows = normalizeToRows(data)

  const handleExportCSV = useCallback(() => {
    const csvRows = rows.map(r => ({ key: r.key, value: formatCellValue(r.value) }))
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').slice(0, 30)
    exportToCSV(csvRows, ['key', 'value'], sanitizedTitle)
  }, [rows, title])

  const handleExportExcel = useCallback(async () => {
    const excelRows = rows.map(r => ({ key: r.key, value: formatCellValue(r.value) }))
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').slice(0, 30)
    await exportToExcel(excelRows, ['key', 'value'], sanitizedTitle)
  }, [rows, title])

  return (
    <div
      ref={backdropRef}
      className="modal-backdrop"
      onClick={e => { if (e.target === backdropRef.current) onClose() }}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col"
        style={{ width: '90vw', maxWidth: 1000, maxHeight: '80vh' }}>
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700 flex-shrink-0 flex-wrap">
          <span className="text-sm font-semibold text-blue-400 font-mono truncate">{title}</span>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{rows.length} satır</span>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded bg-emerald-800 hover:bg-emerald-700 text-emerald-200 transition"
            >
              <FileText size={12} />
              CSV
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded bg-green-800 hover:bg-green-700 text-green-200 transition"
            >
              <Download size={12} />
              Excel
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <DataTable rows={rows} />
        </div>
      </div>
    </div>
  )
}
