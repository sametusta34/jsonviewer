import { useEffect, useRef, useCallback, useState } from 'react'
import { X, Download, FileText, FileSpreadsheet, LayoutGrid, Code, Maximize2, Minimize2 } from 'lucide-react'
import DataTable from './DataTable'
import ColonView from './ColonView'
import { normalizeToRows, formatCellValue } from '../utils/jsonUtils'
import { exportToCSV, exportToExcel } from '../utils/exportUtils'

type ViewMode = 'colon' | 'table'

interface Props {
  title: string
  data: unknown
  onClose: () => void
}

export default function NestedModal({ title, data, onClose }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('colon')
  const [isFullscreen, setIsFullscreen] = useState(false)

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
      <div className={`bg-slate-900 border border-slate-700 shadow-2xl flex flex-col ${isFullscreen ? 'w-screen h-screen rounded-none' : 'rounded-xl'}`}
        style={isFullscreen ? {} : { width: '90vw', maxWidth: 1000, maxHeight: '80vh' }}>
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700 flex-shrink-0 flex-wrap">
          <span className="text-sm font-semibold text-blue-400 font-mono truncate">{title}</span>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-700 rounded p-0.5">
              <button
                onClick={() => setViewMode('colon')}
                title="Colon Format"
                className={`p-1 rounded transition text-xs ${viewMode === 'colon' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Code size={13} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                title="Tablo Format"
                className={`p-1 rounded transition text-xs ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <LayoutGrid size={13} />
              </button>
            </div>
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
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title={isFullscreen ? 'Kapat' : 'Tam ekran'}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {viewMode === 'colon' ? (
            <ColonView data={data} />
          ) : (
            <DataTable rows={rows} />
          )}
        </div>
      </div>
    </div>
  )
}
