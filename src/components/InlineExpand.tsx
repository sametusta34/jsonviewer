import { useState, useCallback } from 'react'
import { ChevronRight, ChevronDown, Eye, Download, FileText } from 'lucide-react'
import { isNested, formatValueWithColons } from '../utils/jsonUtils'
import { exportToCSV, exportToExcel } from '../utils/exportUtils'

interface Props {
  data: unknown
  depth?: number
  onOpenModal?: (title: string, data: unknown) => void
}

function getNestedInfo(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.length}]`
  }
  if (typeof value === 'object' && value !== null) {
    return `{${Object.keys(value).length}}`
  }
  return ''
}

export default function InlineExpand({ data, depth = 0, onOpenModal }: Props) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())

  const handleExportCSV = useCallback(() => {
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
      const columns = Object.keys(data[0] as Record<string, unknown>)
      exportToCSV(data as Record<string, unknown>[], columns, 'export.csv')
    } else if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      const columns = Object.keys(data as Record<string, unknown>)
      exportToCSV([data as Record<string, unknown>], columns, 'export.csv')
    }
  }, [data])

  const handleExportExcel = useCallback(async () => {
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
      const columns = Object.keys(data[0] as Record<string, unknown>)
      await exportToExcel(data as Record<string, unknown>[], columns, 'export.xlsx')
    } else if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      const columns = Object.keys(data as Record<string, unknown>)
      await exportToExcel([data as Record<string, unknown>], columns, 'export.xlsx')
    }
  }, [data])

  const toggleExpand = (key: string) => {
    setExpandedKeys(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const getAllNestedKeys = (value: unknown, prefix: string = ''): Set<string> => {
    const result = new Set<string>()

    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
      const items = value as Record<string, unknown>[]
      items.forEach((item, idx) => {
        if (typeof item === 'object' && item !== null) {
          Object.keys(item as Record<string, unknown>).forEach(k => {
            const nestedVal = (item as Record<string, unknown>)[k]
            const cellId = `${prefix}${idx}-${k}`
            if (isNested(nestedVal)) {
              result.add(cellId)
              const nestedKeys = getAllNestedKeys(nestedVal, cellId + ':')
              nestedKeys.forEach(key => result.add(key))
            }
          })
        }
      })
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>
      Object.keys(obj).forEach(k => {
        const nestedVal = obj[k]
        const cellId = `${prefix}${k}`
        if (isNested(nestedVal)) {
          result.add(cellId)
          const nestedKeys = getAllNestedKeys(nestedVal, cellId + ':')
          nestedKeys.forEach(key => result.add(key))
        }
      })
    }

    return result
  }

  const expandAll = () => {
    const allKeys = getAllNestedKeys(data)
    setExpandedKeys(allKeys)
  }

  const collapseAll = () => {
    setExpandedKeys(new Set())
  }

  // Array of objects → mini table
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
    const items = data as Record<string, unknown>[]
    const allKeys = new Set<string>()
    items.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item as Record<string, unknown>).forEach(k => allKeys.add(k))
      }
    })
    const keys = Array.from(allKeys)

    return (
      <>
        {depth < 2 && (
          <div className="flex items-center gap-1 mb-1">
            <button
              onClick={expandAll}
              className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/60 hover:bg-blue-900 text-blue-300 transition"
              title="Tüm nested verileri aç"
            >
              Aç
            </button>
            <button
              onClick={collapseAll}
              className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/60 hover:bg-blue-900 text-blue-300 transition"
              title="Tüm nested verileri kapat"
            >
              Kapat
            </button>
            <div className="flex-1" />
            <button
              onClick={handleExportCSV}
              className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-700/80 hover:bg-emerald-700 text-emerald-200 transition flex items-center gap-0.5"
              title="CSV indir"
            >
              <FileText size={10} />
              CSV
            </button>
            <button
              onClick={handleExportExcel}
              className="text-[10px] px-1.5 py-0.5 rounded bg-green-700/80 hover:bg-green-700 text-green-200 transition flex items-center gap-0.5"
              title="Excel indir"
            >
              <Download size={10} />
              XL
            </button>
          </div>
        )}
      <table className="w-full text-xs border-collapse">
        <thead className="bg-slate-800/50 border-b border-slate-700">
          <tr>
            {keys.map(key => (
              <th key={key} className="px-2 py-1 text-left text-slate-300 border-r border-slate-700 last:border-r-0 text-[10px]">
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <>
              <tr key={`row-${idx}`} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                {keys.map(key => {
                  const value = (item as Record<string, unknown>)[key]
                  const cellId = `${idx}-${key}`
                  const isExpanded = expandedKeys.has(cellId)

                  return (
                    <td key={cellId} className="px-2 py-1 text-[10px] font-mono border-r border-slate-700/50 last:border-r-0">
                      {isNested(value) ? (
                        <div className="inline-flex items-center gap-1">
                          {depth < 2 && (
                            <button
                              onClick={() => toggleExpand(cellId)}
                              className="text-blue-400 hover:text-blue-300 transition p-0.5"
                              title="İçe aç"
                            >
                              {isExpanded ? <ChevronDown size={8} /> : <ChevronRight size={8} />}
                            </button>
                          )}
                          {onOpenModal && (
                            <button
                              onClick={() => onOpenModal(`${key} [${idx}]`, value)}
                              className="text-blue-400 hover:text-blue-300 transition p-0.5"
                              title="Popup'ta aç"
                            >
                              <Eye size={8} />
                            </button>
                          )}
                          <span className="text-blue-400 truncate text-[9px]">{key}</span>
                        </div>
                      ) : value === null ? (
                        <span className="text-slate-500 italic">null</span>
                      ) : typeof value === 'boolean' ? (
                        <span className={value ? 'text-green-400' : 'text-red-400'}>{String(value)}</span>
                      ) : typeof value === 'number' ? (
                        <span className="text-amber-400">{String(value)}</span>
                      ) : (
                        <span className="text-slate-200 truncate">{String(value)}</span>
                      )}
                    </td>
                  )
                })}
              </tr>
              {depth < 2 &&
                keys
                  .filter(k => expandedKeys.has(`${idx}-${k}`) && isNested((item as Record<string, unknown>)[k]))
                  .map(key => (
                    <tr key={`exp-${idx}-${key}`} className="bg-slate-900/40 border-b border-slate-700/50">
                      <td colSpan={keys.length} className="p-0">
                        <div className="border-l-2 border-blue-500 ml-1 pl-2 py-1">
                          <div className="text-[10px] text-blue-400 font-mono mb-1">{key}</div>
                          <InlineExpand data={(item as Record<string, unknown>)[key]} depth={depth + 1} onOpenModal={onOpenModal} />
                        </div>
                      </td>
                    </tr>
                  ))}
            </>
          ))}
        </tbody>
      </table>
      </>
    )
  }

  // Single object → key-value table
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>
    const entries = Object.entries(obj)

    return (
      <>
        {depth < 2 && (
          <div className="flex items-center gap-1 mb-1">
            <button
              onClick={expandAll}
              className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/60 hover:bg-blue-900 text-blue-300 transition"
              title="Tüm nested verileri aç"
            >
              Aç
            </button>
            <button
              onClick={collapseAll}
              className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/60 hover:bg-blue-900 text-blue-300 transition"
              title="Tüm nested verileri kapat"
            >
              Kapat
            </button>
            <div className="flex-1" />
            <button
              onClick={handleExportCSV}
              className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-700/80 hover:bg-emerald-700 text-emerald-200 transition flex items-center gap-0.5"
              title="CSV indir"
            >
              <FileText size={10} />
              CSV
            </button>
            <button
              onClick={handleExportExcel}
              className="text-[10px] px-1.5 py-0.5 rounded bg-green-700/80 hover:bg-green-700 text-green-200 transition flex items-center gap-0.5"
              title="Excel indir"
            >
              <Download size={10} />
              XL
            </button>
          </div>
        )}
      <table className="w-full text-xs border-collapse">
        <tbody>
          {entries.map(([key, value]) => (
            <>
              <tr key={key} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                <td className="px-2 py-1 text-blue-300 border-r border-slate-700/50 font-mono text-[10px] w-1/3">
                  {key}
                </td>
                <td className="px-2 py-1 text-slate-200 font-mono text-[10px]">
                  {isNested(value) ? (
                    <div className="inline-flex items-center gap-1">
                      {depth < 2 && (
                        <button
                          onClick={() => toggleExpand(key)}
                          className="text-blue-400 hover:text-blue-300 transition p-0.5"
                          title="İçe aç"
                        >
                          {expandedKeys.has(key) ? <ChevronDown size={8} /> : <ChevronRight size={8} />}
                        </button>
                      )}
                      {onOpenModal && (
                        <button
                          onClick={() => onOpenModal(key, value)}
                          className="text-blue-400 hover:text-blue-300 transition p-0.5"
                          title="Popup'ta aç"
                        >
                          <Eye size={8} />
                        </button>
                      )}
                      <span className="text-blue-400 truncate">{key} {getNestedInfo(value)}</span>
                    </div>
                  ) : value === null ? (
                    <span className="text-slate-500 italic">null</span>
                  ) : typeof value === 'boolean' ? (
                    <span className={value ? 'text-green-400' : 'text-red-400'}>{String(value)}</span>
                  ) : typeof value === 'number' ? (
                    <span className="text-amber-400">{String(value)}</span>
                  ) : (
                    <span className="text-slate-200 truncate">{String(value)}</span>
                  )}
                </td>
              </tr>
              {depth < 2 && expandedKeys.has(key) && isNested(value) && (
                <tr key={`exp-${key}`} className="bg-slate-900/40 border-b border-slate-700/50">
                  <td colSpan={2} className="p-0">
                    <div className="border-l-2 border-blue-500 ml-1 pl-2 py-1">
                      <InlineExpand data={value} depth={depth + 1} onOpenModal={onOpenModal} />
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
      </>
    )
  }

  // Primitive array
  if (Array.isArray(data)) {
    return (
      <div className="text-xs font-mono text-slate-200 space-y-0.5">
        {data.map((item, idx) => (
          <div key={idx} className="px-2 py-0.5">
            <span className="text-blue-400">[{idx}]</span>
            <span className="text-slate-400">: </span>
            <span className="text-slate-200">{String(item)}</span>
          </div>
        ))}
      </div>
    )
  }

  // Primitive value
  return (
    <span className="text-xs font-mono text-slate-200 px-2 py-1 block">
      {depth >= 3 ? formatValueWithColons(data).substring(0, 60) + '...' : formatValueWithColons(data)}
    </span>
  )
}
