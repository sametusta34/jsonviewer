import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import DataTable from './DataTable'
import { normalizeToRows, collectColumns } from '../utils/jsonUtils'

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
  const columns = collectColumns(rows)

  return (
    <div
      ref={backdropRef}
      className="modal-backdrop"
      onClick={e => { if (e.target === backdropRef.current) onClose() }}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col"
        style={{ width: '90vw', maxWidth: 1000, maxHeight: '80vh' }}>
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700 flex-shrink-0">
          <span className="text-sm font-semibold text-blue-400 font-mono truncate">{title}</span>
          <div className="flex-1" />
          <span className="text-xs text-slate-500">{rows.length} satır · {columns.length} sütun</span>
          <button
            onClick={onClose}
            className="ml-2 p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <DataTable rows={rows} columns={columns} />
        </div>
      </div>
    </div>
  )
}
