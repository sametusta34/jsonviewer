import { useState, useMemo } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { Relationship } from '../App'

interface RelationshipModalProps {
  tables: Record<string, unknown>
  multiTableKeys: string[]
  onAdd: (rel: Omit<Relationship, 'id'>) => void
  onClose: () => void
}

function getTableColumns(tables: Record<string, unknown>, tableName: string): string[] {
  try {
    const data = tables[tableName]
    if (!Array.isArray(data) || data.length === 0) return []
    const first = data[0]
    if (typeof first !== 'object' || first === null) return []
    return Object.keys(first as Record<string, unknown>)
  } catch (e) {
    console.error('Sütunları alırken hata:', e)
    return []
  }
}

export default function RelationshipModal({
  tables,
  multiTableKeys,
  onAdd,
  onClose,
}: RelationshipModalProps) {
  const [fromTable, setFromTable] = useState(multiTableKeys[0] || '')
  const [fromCol, setFromCol] = useState('')
  const [toTable, setToTable] = useState(multiTableKeys[1] || '')
  const [toCol, setToCol] = useState('')
  const [error, setError] = useState('')

  const fromColumns = useMemo(() => getTableColumns(tables, fromTable), [tables, fromTable])
  const toColumns = useMemo(() => getTableColumns(tables, toTable), [tables, toTable])

  const canAdd =
    fromTable &&
    fromCol &&
    toTable &&
    toCol &&
    fromTable !== toTable

  const handleSubmit = () => {
    try {
      setError('')
      if (!canAdd) {
        setError('Lütfen tüm alanları doldurun')
        return
      }
      onAdd({
        fromTable,
        fromCol,
        toTable,
        toCol,
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Bilinmeyen hata'
      setError(`İlişki eklenirken hata: ${message}`)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl max-w-md w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h2 className="text-sm font-bold text-white">İlişki Tanımla</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="px-4 pt-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-red-900/30 border border-red-700 rounded text-xs text-red-300">
              <AlertCircle size={14} />
              {error}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* From section */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Kaynak Tablo</label>
            <select
              value={fromTable}
              onChange={e => {
                setFromTable(e.target.value)
                setFromCol('')
              }}
              className="w-full bg-slate-800 border border-slate-600 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Seçin...</option>
              {multiTableKeys.map(key => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Kaynak Sütunu</label>
            <select
              value={fromCol}
              onChange={e => setFromCol(e.target.value)}
              disabled={!fromTable}
              className="w-full bg-slate-800 border border-slate-600 rounded px-2.5 py-1.5 text-xs text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-blue-500"
            >
              <option value="">Seçin...</option>
              {fromColumns.map(col => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          {/* Arrow indicator */}
          <div className="flex items-center justify-center py-2">
            <div className="text-xs text-slate-500 font-mono">→</div>
          </div>

          {/* To section */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Hedef Tablo</label>
            <select
              value={toTable}
              onChange={e => {
                setToTable(e.target.value)
                setToCol('')
              }}
              className="w-full bg-slate-800 border border-slate-600 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Seçin...</option>
              {multiTableKeys.map(key => (
                <option key={key} value={key} disabled={key === fromTable}>
                  {key}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Hedef Sütunu</label>
            <select
              value={toCol}
              onChange={e => setToCol(e.target.value)}
              disabled={!toTable}
              className="w-full bg-slate-800 border border-slate-600 rounded px-2.5 py-1.5 text-xs text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-blue-500"
            >
              <option value="">Seçin...</option>
              {toColumns.map(col => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-4 py-3 border-t border-slate-700">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-1.5 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canAdd}
            className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition ${
              canAdd
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            İlişki Ekle
          </button>
        </div>
      </div>
    </div>
  )
}
