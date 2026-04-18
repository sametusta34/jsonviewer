import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { FileJson2, Download, FileSpreadsheet, FileText, ChevronRight, ChevronLeft, LayoutGrid } from 'lucide-react'
import JsonEditor from './components/JsonEditor'
import DataTable from './components/DataTable'
import { parseJSON, normalizeToRows, formatCellValue } from './utils/jsonUtils'
import { exportToCSV, exportToExcel } from './utils/exportUtils'

const SAMPLE_JSON = `[
  {
    "id": 1,
    "name": "Alice Johnson",
    "age": 30,
    "active": true,
    "score": 95.5,
    "address": {
      "city": "Istanbul",
      "zip": "34000",
      "country": "Turkey"
    },
    "tags": ["admin", "editor"],
    "metadata": null
  },
  {
    "id": 2,
    "name": "Bob Smith",
    "age": 25,
    "active": false,
    "score": 78.2,
    "address": {
      "city": "Ankara",
      "zip": "06000",
      "country": "Turkey"
    },
    "tags": ["viewer"],
    "metadata": { "source": "import", "version": 2 }
  },
  {
    "id": 3,
    "name": "Carol White",
    "age": 35,
    "active": true,
    "score": 88.0,
    "address": {
      "city": "Izmir",
      "zip": "35000",
      "country": "Turkey"
    },
    "tags": ["editor", "viewer"],
    "metadata": { "source": "manual", "version": 1 }
  }
]`

type PanelMode = 'both' | 'editor' | 'table'

export default function App() {
  const [raw, setRaw] = useState(SAMPLE_JSON)
  const [panelMode, setPanelMode] = useState<PanelMode>('both')
  const [splitPct, setSplitPct] = useState(35)
  const dragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const parseResult = useMemo(() => parseJSON(raw), [raw])
  const isValid = parseResult.ok

  const rows = useMemo(() => {
    if (!parseResult.ok) return []
    return normalizeToRows(parseResult.data)
  }, [parseResult])

  const handleExportCSV = useCallback(() => {
    const csvRows = rows.map(r => ({ key: r.key, value: formatCellValue(r.value) }))
    exportToCSV(csvRows, ['key', 'value'])
  }, [rows])

  const handleExportExcel = useCallback(() => {
    const excelRows = rows.map(r => ({ key: r.key, value: formatCellValue(r.value) }))
    exportToExcel(excelRows, ['key', 'value'])
  }, [rows])

  // Drag split
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
  }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = ((e.clientX - rect.left) / rect.width) * 100
      setSplitPct(Math.min(80, Math.max(20, pct)))
    }
    const onUp = () => { dragging.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-2.5 bg-slate-800 border-b border-slate-700 flex-shrink-0">
        <FileJson2 size={22} className="text-blue-400" />
        <h1 className="text-base font-bold text-white tracking-tight">JSON Viewer</h1>
        <div className="w-px h-5 bg-slate-600 mx-1" />

        {/* Panel mode buttons */}
        <div className="flex items-center gap-1 bg-slate-900 rounded p-0.5">
          <button
            onClick={() => setPanelMode('editor')}
            title="Yalnızca Editör"
            className={`p-1.5 rounded transition text-xs ${panelMode === 'editor' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <FileJson2 size={14} />
          </button>
          <button
            onClick={() => setPanelMode('both')}
            title="İkili Görünüm"
            className={`p-1.5 rounded transition text-xs ${panelMode === 'both' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setPanelMode('table')}
            title="Yalnızca Tablo"
            className={`p-1.5 rounded transition text-xs ${panelMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <FileSpreadsheet size={14} />
          </button>
        </div>

        <div className="flex-1" />

        {/* Export buttons */}
        {isValid && rows.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-emerald-800 hover:bg-emerald-700 text-emerald-200 transition"
            >
              <FileText size={13} />
              CSV İndir
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-green-800 hover:bg-green-700 text-green-200 transition"
            >
              <Download size={13} />
              Excel İndir
            </button>
          </div>
        )}

        {/* Stats */}
        {isValid && rows.length > 0 && (
          <span className="text-xs text-slate-500 ml-1">
            {rows.length} satır
          </span>
        )}
      </header>

      {/* Main content */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden relative">
        {/* Editor panel */}
        {(panelMode === 'both' || panelMode === 'editor') && (
          <div
            className="flex flex-col overflow-hidden border-r border-slate-700"
            style={{
              width: panelMode === 'editor' ? '100%' : panelMode === 'both' ? `${splitPct}%` : '0%',
              flexShrink: 0,
            }}
          >
            <JsonEditor
              value={raw}
              onChange={setRaw}
              error={parseResult.ok ? null : parseResult.error}
              errorLine={parseResult.ok ? undefined : parseResult.line}
              errorCol={parseResult.ok ? undefined : parseResult.col}
              isValid={isValid}
            />
          </div>
        )}

        {/* Drag handle */}
        {panelMode === 'both' && (
          <div
            className="resize-handle flex-shrink-0 flex items-center justify-center group cursor-col-resize select-none"
            onMouseDown={onMouseDown}
          >
            <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition">
              <ChevronLeft size={8} className="text-slate-400" />
              <ChevronRight size={8} className="text-slate-400" />
            </div>
          </div>
        )}

        {/* Table panel */}
        {(panelMode === 'both' || panelMode === 'table') && (
          <div
            className="flex flex-col overflow-hidden flex-1"
            style={{ minWidth: 0 }}
          >
            {!isValid ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-600">
                <FileJson2 size={48} strokeWidth={1} />
                <p className="text-sm">Geçerli bir JSON girin</p>
              </div>
            ) : rows.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-600 text-sm">
                Gösterilecek veri yok
              </div>
            ) : (
              <DataTable rows={rows} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
