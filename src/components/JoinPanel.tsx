import { useState, useMemo } from 'react'
import { X, Download, FileText } from 'lucide-react'
import { joinTables, isArrayOfObjects, getObjectKeys } from '../utils/joinUtils'
import { exportToCSV, exportToExcel } from '../utils/exportUtils'
import { formatCellValue } from '../utils/jsonUtils'
import ColonView from './ColonView'

interface JoinPanelProps {
  tables: Record<string, unknown>
  onClose: () => void
}

export default function JoinPanel({ tables, onClose }: JoinPanelProps) {
  const tableNames = useMemo(() => {
    return Object.keys(tables).filter(k => isArrayOfObjects((tables as Record<string, unknown>)[k]))
  }, [tables])

  const [leftTable, setLeftTable] = useState(tableNames[0] || '')
  const [rightTable, setRightTable] = useState(tableNames[1] || '')
  const [leftKey, setLeftKey] = useState('')
  const [rightKey, setRightKey] = useState('')
  const [rightPrefix, setRightPrefix] = useState(`${rightTable}_`)
  const [joinResult, setJoinResult] = useState<Record<string, unknown>[] | null>(null)

  const leftData = (tables as Record<string, unknown>)[leftTable] as Record<string, unknown>[] | undefined
  const rightData = (tables as Record<string, unknown>)[rightTable] as Record<string, unknown>[] | undefined

  const leftColumns = useMemo(() => {
    return leftData && leftData.length > 0 ? getObjectKeys(leftData[0]) : []
  }, [leftData])

  const rightColumns = useMemo(() => {
    return rightData && rightData.length > 0 ? getObjectKeys(rightData[0]) : []
  }, [rightData])

  const handleJoin = () => {
    if (!leftData || !rightData || !leftKey || !rightKey) {
      alert('Lütfen tüm alanları seçiniz')
      return
    }
    const result = joinTables(leftData, rightData, leftKey, rightKey, rightPrefix)
    setJoinResult(result)
  }

  const handleExportCSV = () => {
    if (!joinResult) return
    const columns = joinResult.length > 0 ? Object.keys(joinResult[0]) : []
    const csvRows = joinResult.map(r => {
      const row: Record<string, unknown> = {}
      columns.forEach(col => {
        row[col] = r[col]
      })
      return row
    })
    exportToCSV(csvRows, columns, 'joined-data.csv')
  }

  const handleExportExcel = async () => {
    if (!joinResult) return
    const columns = joinResult.length > 0 ? Object.keys(joinResult[0]) : []
    const excelRows = joinResult.map(r => {
      const row: Record<string, unknown> = {}
      columns.forEach(col => {
        row[col] = r[col]
      })
      return row
    })
    await exportToExcel(excelRows, columns, 'joined-data.xlsx')
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white">Tabloları Birleştir (JOIN)</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded transition text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4">
          {!joinResult ? (
            <div className="space-y-4">
              {/* Table Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Sol Tablo</label>
                  <select
                    value={leftTable}
                    onChange={(e) => {
                      setLeftTable(e.target.value)
                      setLeftKey('')
                      setJoinResult(null)
                    }}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Seçiniz --</option>
                    {tableNames.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Sağ Tablo</label>
                  <select
                    value={rightTable}
                    onChange={(e) => {
                      setRightTable(e.target.value)
                      setRightKey('')
                      setRightPrefix(`${e.target.value}_`)
                      setJoinResult(null)
                    }}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Seçiniz --</option>
                    {tableNames.filter(name => name !== leftTable).map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Key Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Sol Alan (Join Alanı)</label>
                  <select
                    value={leftKey}
                    onChange={(e) => setLeftKey(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
                    disabled={!leftTable}
                  >
                    <option value="">-- Seçiniz --</option>
                    {leftColumns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Sağ Alan (Eşleştir)</label>
                  <select
                    value={rightKey}
                    onChange={(e) => setRightKey(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
                    disabled={!rightTable}
                  >
                    <option value="">-- Seçiniz --</option>
                    {rightColumns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prefix */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Sağ Tablo Kolon Öneki</label>
                <input
                  type="text"
                  value={rightPrefix}
                  onChange={(e) => setRightPrefix(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
                  placeholder="apiary_"
                />
              </div>

              {/* Join Button */}
              <button
                onClick={handleJoin}
                disabled={!leftTable || !rightTable || !leftKey || !rightKey}
                className="w-full px-4 py-2.5 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium transition"
              >
                Join Yap
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-300">
                  Sonuç: {joinResult.length} satır
                </h3>
                <button
                  onClick={() => setJoinResult(null)}
                  className="px-3 py-1.5 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-200 transition"
                >
                  Geri Dön
                </button>
              </div>
              <div className="bg-slate-800 rounded border border-slate-700 overflow-hidden">
                <ColonView data={joinResult} hideExport={true} />
              </div>
            </div>
          )}
        </div>

        {/* Footer (Export) */}
        {joinResult && (
          <div className="flex items-center gap-2 p-4 border-t border-slate-700 flex-shrink-0 bg-slate-800">
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
      </div>
    </div>
  )
}
