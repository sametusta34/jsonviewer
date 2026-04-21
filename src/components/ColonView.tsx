import { useState, useMemo, useRef, useEffect } from 'react'
import { formatValueWithColons, isNested, formatCellValue, calculateColumnStats, ColumnStats } from '../utils/jsonUtils'
import { X, Filter, ChevronUp, ChevronDown, ChevronsUpDown, ChevronRight, Columns2, Eye, Download, FileText, Calculator, ChevronUp as ChevronUpIcon } from 'lucide-react'
import InlineExpand from './InlineExpand'
import NestedModal from './NestedModal'
import { exportToCSV, exportToExcel } from '../utils/exportUtils'

interface ColonViewProps {
  data: unknown
  hideExport?: boolean
  title?: string
}

interface NestedState {
  title: string
  data: unknown
}

type FilterOp = 'contains' | 'excludes' | 'startsWith' | 'endsWith' | 'equals' | 'notEquals' | 'gt' | 'lt' | 'gte' | 'lte' | 'isEmpty' | 'isNotEmpty'

interface ColumnFilter {
  op: FilterOp
  value: string
}

interface SortState {
  column: string
  direction: 'asc' | 'desc'
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

const FILTER_OPS: { label: string; op: FilterOp }[] = [
  { label: 'İçinde ara', op: 'contains' },
  { label: 'Hariç tut', op: 'excludes' },
  { label: 'Başında ara', op: 'startsWith' },
  { label: 'Sonunda ara', op: 'endsWith' },
  { label: 'Eşit', op: 'equals' },
  { label: 'Eşit değil', op: 'notEquals' },
  { label: 'Büyüktür', op: 'gt' },
  { label: 'Küçüktür', op: 'lt' },
  { label: 'Büyük eşit', op: 'gte' },
  { label: 'Küçük eşit', op: 'lte' },
  { label: 'Boş', op: 'isEmpty' },
  { label: 'Boş değil', op: 'isNotEmpty' },
]

export default function ColonView({ data, hideExport = false, title }: ColonViewProps) {
  // All hooks MUST be called unconditionally at the top
  const [columnFilters, setColumnFilters] = useState<Record<string, ColumnFilter>>({})
  const [sort, setSort] = useState<SortState | null>(null)
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null)
  const [filterPos, setFilterPos] = useState({ top: 0, left: 0 })
  const [nested, setNested] = useState<NestedState | null>(null)
  const [columnOrder, setColumnOrder] = useState<string[]>([])
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})
  const [showColumnPanel, setShowColumnPanel] = useState(false)
  const [dragKey, setDragKey] = useState<string | null>(null)
  const [dragOverKey, setDragOverKey] = useState<string | null>(null)
  const [expandedCells, setExpandedCells] = useState<Set<string>>(new Set())
  const [showStats, setShowStats] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)
  const filterButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const columnPanelRef = useRef<HTMLDivElement>(null)
  const columnPanelButtonRef = useRef<HTMLButtonElement | null>(null)

  const handleExportCSV = () => {
    if (!data) return

    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
      // Array of objects
      const columns = Object.keys(data[0] as Record<string, unknown>)
      exportToCSV(data as Record<string, unknown>[], columns, 'export.csv')
    } else if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      // Single object
      const columns = Object.keys(data as Record<string, unknown>)
      exportToCSV([data as Record<string, unknown>], columns, 'export.csv')
    }
  }

  const handleExportExcel = async () => {
    if (!data) return

    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
      // Array of objects
      const columns = Object.keys(data[0] as Record<string, unknown>)
      await exportToExcel(data as Record<string, unknown>[], columns, 'export.xlsx')
    } else if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      // Single object
      const columns = Object.keys(data as Record<string, unknown>)
      await exportToExcel([data as Record<string, unknown>], columns, 'export.xlsx')
    }
  }

  const toggleExpand = (cellId: string) => {
    setExpandedCells(prev => {
      const next = new Set(prev)
      next.has(cellId) ? next.delete(cellId) : next.add(cellId)
      return next
    })
  }

  const expandAll = () => {
    const getAllNestedCells = (value: unknown, prefix: string = ''): Set<string> => {
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
                const nestedCells = getAllNestedCells(nestedVal, cellId + ':')
                nestedCells.forEach(cell => result.add(cell))
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
            const nestedCells = getAllNestedCells(nestedVal, cellId + ':')
            nestedCells.forEach(cell => result.add(cell))
          }
        })
      }

      return result
    }

    const allNestedCells = getAllNestedCells(data)
    setExpandedCells(allNestedCells)
  }

  const collapseAll = () => {
    setExpandedCells(new Set())
  }

  useEffect(() => {
    if (activeFilterColumn && filterButtonRefs.current[activeFilterColumn]) {
      const btn = filterButtonRefs.current[activeFilterColumn]
      const rect = btn.getBoundingClientRect()
      setFilterPos({
        top: rect.bottom + 8,
        left: rect.left,
      })
    }
  }, [activeFilterColumn])

  const getDisplayValue = (value: unknown): string => {
    if (value === null) return 'null'
    if (value === undefined) return ''
    if (typeof value === 'boolean') return value ? 'true' : 'false'
    if (typeof value === 'object') return formatValueWithColons(value)
    return String(value)
  }

  const applyFilter = (value: string, filter: ColumnFilter): boolean => {
    if (!filter.value && !['isEmpty', 'isNotEmpty'].includes(filter.op)) {
      return true
    }

    const lower = value.toLowerCase()
    const filterLower = (filter.value || '').toLowerCase()

    switch (filter.op) {
      case 'contains': return lower.includes(filterLower)
      case 'excludes': return !lower.includes(filterLower)
      case 'startsWith': return lower.startsWith(filterLower)
      case 'endsWith': return lower.endsWith(filterLower)
      case 'equals': return lower === filterLower
      case 'notEquals': return lower !== filterLower
      case 'gt': {
        const num = parseFloat(value)
        const filterNum = parseFloat(filter.value || '0')
        return !isNaN(num) && !isNaN(filterNum) && num > filterNum
      }
      case 'lt': {
        const num = parseFloat(value)
        const filterNum = parseFloat(filter.value || '0')
        return !isNaN(num) && !isNaN(filterNum) && num < filterNum
      }
      case 'gte': {
        const num = parseFloat(value)
        const filterNum = parseFloat(filter.value || '0')
        return !isNaN(num) && !isNaN(filterNum) && num >= filterNum
      }
      case 'lte': {
        const num = parseFloat(value)
        const filterNum = parseFloat(filter.value || '0')
        return !isNaN(num) && !isNaN(filterNum) && num <= filterNum
      }
      case 'isEmpty': return value === '' || value === 'null'
      case 'isNotEmpty': return value !== '' && value !== 'null'
      default: return true
    }
  }

  // Determine data type
  const isArrayOfObjects = Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null
  const isPrimitiveArray = Array.isArray(data) && (data.length === 0 || typeof data[0] !== 'object' || data[0] === null)
  const isObject = !Array.isArray(data) && typeof data === 'object' && data !== null

  // Prepare array of objects data
  const items = isArrayOfObjects ? (data as Record<string, unknown>[]) : []
  const allKeys = useMemo(() => {
    const keys = new Set<string>()
    if (isArrayOfObjects) {
      items.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          Object.keys(item as Record<string, unknown>).forEach(k => keys.add(k))
        }
      })
    }
    return keys
  }, [isArrayOfObjects, items])

  const baseKeys = Array.from(allKeys)
  const orderedKeys = columnOrder.length > 0 ? columnOrder : baseKeys
  const visibleKeys = orderedKeys.filter(k => columnVisibility[k] !== false)

  const filteredItems = useMemo(() => {
    if (!isArrayOfObjects) return []
    return items.filter(item => {
      return Object.entries(columnFilters).every(([key, filter]) => {
        const value = (item as Record<string, unknown>)[key]
        const displayValue = getDisplayValue(value)
        return applyFilter(displayValue, filter)
      })
    })
  }, [columnFilters, isArrayOfObjects, items])

  const sortedItems = useMemo(() => {
    if (!isArrayOfObjects || !sort) return filteredItems

    const sorted = [...filteredItems]
    sorted.sort((a, b) => {
      const aVal = getDisplayValue((a as Record<string, unknown>)[sort.column])
      const bVal = getDisplayValue((b as Record<string, unknown>)[sort.column])

      const numA = parseFloat(aVal)
      const numB = parseFloat(bVal)
      const isNumeric = !isNaN(numA) && !isNaN(numB)

      let cmp = 0
      if (isNumeric) {
        cmp = numA - numB
      } else {
        cmp = aVal.localeCompare(bVal)
      }

      return sort.direction === 'asc' ? cmp : -cmp
    })

    return sorted
  }, [filteredItems, sort, isArrayOfObjects])

  const columnStats = useMemo(() => {
    if (!isArrayOfObjects) return []
    const stats: ColumnStats[] = []
    visibleKeys.forEach(key => {
      const stat = calculateColumnStats(sortedItems, key)
      if (stat) stats.push(stat)
    })
    return stats
  }, [sortedItems, visibleKeys, isArrayOfObjects])

  const hasActiveFilters = Object.keys(columnFilters).length > 0

  useEffect(() => {
    if (!showColumnPanel) return
    const closeOnClick = (e: MouseEvent) => {
      if (columnPanelRef.current && !columnPanelRef.current.contains(e.target as Node) &&
          columnPanelButtonRef.current && !columnPanelButtonRef.current.contains(e.target as Node)) {
        setShowColumnPanel(false)
      }
    }
    window.addEventListener('click', closeOnClick)
    return () => window.removeEventListener('click', closeOnClick)
  }, [showColumnPanel])

  // Render array of objects
  if (isArrayOfObjects) {
    return (
      <>
      <div className="flex flex-col h-full">
        {/* Column toolbar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 border-b border-slate-700 flex-shrink-0 relative flex-wrap">
          <button
            ref={columnPanelButtonRef}
            onClick={() => setShowColumnPanel(v => !v)}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition"
          >
            <Columns2 size={13} />
            Sütunlar ({visibleKeys.length}/{orderedKeys.length})
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={expandAll}
              className="text-xs px-2.5 py-1.5 rounded bg-blue-900/60 hover:bg-blue-900 text-blue-300 transition"
              title="Tüm nested verileri aç"
            >
              Tümünü Aç
            </button>
            <button
              onClick={collapseAll}
              className="text-xs px-2.5 py-1.5 rounded bg-blue-900/60 hover:bg-blue-900 text-blue-300 transition"
              title="Tüm nested verileri kapat"
            >
              Tümünü Kapat
            </button>
          </div>
          <div className="flex-1" />
          {columnStats.length > 0 && (
            <button
              onClick={() => setShowStats(!showStats)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-purple-800 hover:bg-purple-700 text-purple-200 transition"
              title="İstatistikler"
            >
              <Calculator size={13} />
              İstatistikler
            </button>
          )}
          {!hideExport && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-emerald-800 hover:bg-emerald-700 text-emerald-200 transition"
              >
                <FileText size={13} />
                CSV
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-green-800 hover:bg-green-700 text-green-200 transition"
              >
                <Download size={13} />
                Excel
              </button>
            </div>
          )}
          {showColumnPanel && (
            <div
              ref={columnPanelRef}
              className="fixed bg-slate-900 border border-slate-600 rounded shadow-xl z-50 p-3 min-w-[220px]"
              style={{ top: (columnPanelButtonRef.current?.getBoundingClientRect().bottom ?? 0) + 8, left: columnPanelButtonRef.current?.getBoundingClientRect().left ?? 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="text-xs text-slate-400 mb-2 font-semibold">Sütunları Göster/Gizle</div>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {orderedKeys.map(key => (
                  <label key={key} className="flex items-center gap-2 py-1 cursor-pointer hover:text-white text-slate-300 text-xs group">
                    <input
                      type="checkbox"
                      checked={columnVisibility[key] !== false}
                      onChange={e => setColumnVisibility(p => ({ ...p, [key]: e.target.checked }))}
                      className="accent-blue-500"
                    />
                    <span className="truncate">{key}</span>
                  </label>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-700">
                <button
                  onClick={() => setColumnVisibility({})}
                  className="text-xs px-2 py-1 w-full rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition"
                >
                  Tümünü Göster
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Filter bar */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 border-b border-slate-700 flex-shrink-0">
            <span className="text-xs text-slate-400">Aktif Filtreler:</span>
            {Object.entries(columnFilters).map(([key, filter]) => (
              <span key={key} className="text-xs px-2 py-1 bg-blue-900 text-blue-200 rounded flex items-center gap-1">
                {key}: {FILTER_OPS.find(o => o.op === filter.op)?.label} "{filter.value}"
                <button
                  onClick={() => setColumnFilters(prev => {
                    const next = { ...prev }
                    delete next[key]
                    return next
                  })}
                  className="hover:text-blue-100"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <button
              onClick={() => setColumnFilters({})}
              className="text-xs px-2 py-1 rounded bg-red-900/50 hover:bg-red-900 text-red-300 transition"
            >
              Tümünü Temizle
            </button>
            <div className="flex-1" />
            <span className="text-xs text-slate-500">
              {sortedItems.length !== items.length
                ? `${sortedItems.length} / ${items.length}`
                : `${items.length}`}
            </span>
          </div>
        )}

        {/* Table */}
        <div className="overflow-auto flex-1">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-slate-800 border-b border-slate-600">
              <tr>
                {visibleKeys.map(key => (
                  <th
                    key={key}
                    draggable
                    onDragStart={() => setDragKey(key)}
                    onDragOver={(e) => { e.preventDefault(); setDragOverKey(key) }}
                    onDrop={() => {
                      if (dragKey && dragKey !== key) {
                        setColumnOrder(prev => {
                          const cur = prev.length > 0 ? [...prev] : [...baseKeys]
                          const fi = cur.indexOf(dragKey), ti = cur.indexOf(key)
                          cur.splice(fi, 1); cur.splice(ti, 0, dragKey)
                          return cur
                        })
                      }
                      setDragKey(null); setDragOverKey(null)
                    }}
                    onDragEnd={() => { setDragKey(null); setDragOverKey(null) }}
                    className={`px-3 py-2 text-left text-xs font-semibold text-slate-300 border-r border-slate-700 last:border-r-0 relative group select-none transition ${dragKey === key ? 'opacity-50' : ''} ${dragOverKey === key ? 'ring-2 ring-blue-400' : ''}`}
                    style={{ width: columnWidths[key] ?? 140, minWidth: 50 }}
                  >
                    <div className="flex items-center gap-1">
                      <span className="truncate">{key}</span>
                      <div className="flex gap-0.5">
                        <button
                          onClick={() => setSort(sort?.column === key && sort.direction === 'asc' ? null : { column: key, direction: 'asc' })}
                          className={`p-0.5 rounded transition ${sort?.column === key && sort.direction === 'asc' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                          title="Küçükten büyüğe"
                        >
                          <ChevronUp size={12} />
                        </button>
                        <button
                          onClick={() => setSort(sort?.column === key && sort.direction === 'desc' ? null : { column: key, direction: 'desc' })}
                          className={`p-0.5 rounded transition ${sort?.column === key && sort.direction === 'desc' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                          title="Büyükten küçüğe"
                        >
                          <ChevronDown size={12} />
                        </button>

                        <button
                          ref={el => { if (el) filterButtonRefs.current[key] = el }}
                          onClick={() => setActiveFilterColumn(activeFilterColumn === key ? null : key)}
                          className={`p-0.5 rounded transition ${columnFilters[key] ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                          title="Filtre"
                        >
                          <Filter size={12} />
                        </button>
                      </div>
                    </div>
                    <div
                      className="col-resize-handle"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const startX = e.clientX
                        const startW = columnWidths[key] ?? 140
                        const onMove = (ev: MouseEvent) =>
                          setColumnWidths(p => ({ ...p, [key]: Math.max(50, startW + ev.clientX - startX) }))
                        const onUp = () => {
                          window.removeEventListener('mousemove', onMove)
                          window.removeEventListener('mouseup', onUp)
                        }
                        window.addEventListener('mousemove', onMove)
                        window.addEventListener('mouseup', onUp)
                      }}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={visibleKeys.length} className="px-3 py-4 text-center text-slate-500 text-xs">
                    Sonuç bulunamadı
                  </td>
                </tr>
              ) : (
                sortedItems.flatMap((item, idx) => {
                  const mainRow = (
                    <tr key={`row-${idx}`} className="border-b border-slate-700 hover:bg-slate-800/70">
                      {visibleKeys.map(key => {
                        const value = (item as Record<string, unknown>)[key]
                        const cellId = `${idx}-${key}`
                        const isExpanded = expandedCells.has(cellId)

                        return (
                          <td
                            key={cellId}
                            className="px-3 py-2 text-xs font-mono border-r border-slate-700 last:border-r-0 break-words max-w-xs"
                          >
                            {isNested(value) ? (
                              <button
                                className="nested-badge group"
                                onClick={() => toggleExpand(cellId)}
                                title={`${key} ${getNestedInfo(value)} - Tıklayarak aç`}
                              >
                                {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                                <span className="font-mono text-xs truncate text-slate-200">{key} {getNestedInfo(value)}</span>
                              </button>
                            ) : value === null ? (
                              <span className="text-slate-500 italic">null</span>
                            ) : value === undefined ? (
                              <span className="text-slate-600">—</span>
                            ) : typeof value === 'boolean' ? (
                              <span className={value ? 'text-green-400' : 'text-red-400'}>{String(value)}</span>
                            ) : typeof value === 'number' ? (
                              <span className="text-amber-400">{String(value)}</span>
                            ) : (
                              <span className="text-slate-200">{String(value)}</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )

                  const expandedRows = visibleKeys
                    .filter(k => expandedCells.has(`${idx}-${k}`) && isNested((item as Record<string, unknown>)[k]))
                    .map(key => (
                      <tr key={`exp-${idx}-${key}`} className="bg-slate-900/40 border-b border-slate-700">
                        <td colSpan={visibleKeys.length} className="p-0">
                          <div className="border-l-2 border-blue-500 ml-2 pl-3 py-2">
                            <div className="text-xs text-blue-400 font-mono mb-2">{key}</div>
                            <InlineExpand data={(item as Record<string, unknown>)[key]} depth={0} onOpenModal={(title, data) => setNested({ title, data })} />
                          </div>
                        </td>
                      </tr>
                    ))

                  return [mainRow, ...expandedRows]
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Statistics modal */}
        {showStats && columnStats.length > 0 && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-auto border border-slate-700">
              <div className="sticky top-0 bg-slate-800 flex items-center gap-3 px-6 py-4 border-b border-slate-700">
                <Calculator size={20} className="text-purple-400" />
                <span className="text-lg font-semibold text-slate-200">İstatistikler</span>
                <button
                  onClick={() => setShowStats(false)}
                  className="ml-auto p-1 text-slate-400 hover:text-slate-200 transition rounded hover:bg-slate-700"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {columnStats.map(stat => (
                    <div key={stat.column} className="bg-slate-900/60 rounded-lg p-5 border border-slate-600 hover:border-slate-500 transition">
                      <div className="font-bold text-slate-100 mb-4 text-base border-b border-slate-700 pb-2">{stat.column}</div>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Minimum:</span>
                          <span className="text-slate-100 font-mono text-base">{stat.min?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Maximum:</span>
                          <span className="text-slate-100 font-mono text-base">{stat.max?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Toplam:</span>
                          <span className="text-slate-100 font-mono text-base">{stat.sum.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-slate-700">
                          <span className="text-slate-400 font-semibold">Ortalama:</span>
                          <span className="text-amber-400 font-mono text-base font-bold">{stat.avg?.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fixed filter dropdown */}
        {activeFilterColumn && (
          <div
            ref={filterRef}
            className="fixed bg-slate-900 border border-slate-600 rounded shadow-lg z-50 p-3 min-w-[260px]"
            style={{ top: filterPos.top, left: filterPos.left }}
            onClick={e => e.stopPropagation()}
          >
            <div className="space-y-2">
              <div>
                <label className="text-xs text-slate-400 block mb-1">İşlem:</label>
                <select
                  value={columnFilters[activeFilterColumn]?.op || 'contains'}
                  onChange={e => setColumnFilters(prev => ({
                    ...prev,
                    [activeFilterColumn]: { op: e.target.value as FilterOp, value: prev[activeFilterColumn]?.value || '' }
                  }))}
                  className="w-full bg-slate-800 text-slate-200 text-xs rounded px-2 py-1 border border-slate-600 outline-none focus:border-blue-500"
                >
                  {FILTER_OPS.map(op => (
                    <option key={op.op} value={op.op}>{op.label}</option>
                  ))}
                </select>
              </div>

              {!['isEmpty', 'isNotEmpty'].includes(columnFilters[activeFilterColumn]?.op || 'contains') && (
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Değer:</label>
                  <input
                    type="text"
                    value={columnFilters[activeFilterColumn]?.value || ''}
                    onChange={e => setColumnFilters(prev => ({
                      ...prev,
                      [activeFilterColumn]: { op: prev[activeFilterColumn]?.op || 'contains', value: e.target.value }
                    }))}
                    placeholder="Değer girin"
                    className="w-full bg-slate-800 text-slate-200 text-xs rounded px-2 py-1 border border-slate-600 outline-none focus:border-blue-500"
                    autoFocus
                  />
                </div>
              )}

              <div className="flex gap-1 pt-2">
                <button
                  onClick={() => {
                    if (columnFilters[activeFilterColumn]) {
                      setColumnFilters(prev => {
                        const next = { ...prev }
                        delete next[activeFilterColumn]
                        return next
                      })
                    }
                    setActiveFilterColumn(null)
                  }}
                  className="flex-1 text-xs px-2 py-1 rounded bg-red-900/50 hover:bg-red-900 text-red-300 transition"
                >
                  Temizle
                </button>
                <button
                  onClick={() => setActiveFilterColumn(null)}
                  className="flex-1 text-xs px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white transition"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {nested && (
        <NestedModal
          title={nested.title}
          data={nested.data}
          onClose={() => setNested(null)}
        />
      )}
    </>
    )
  }

  if (isPrimitiveArray) {
    return (
      <>
        <div className="bg-slate-800 rounded">
          {(data as unknown[]).map((item, idx) => (
            <div
              key={idx}
              className="py-2 px-4 border-b border-slate-700 last:border-b-0 font-mono text-sm"
            >
              <span className="text-blue-300">[{idx}]</span>
              <span className="text-slate-400">: </span>
              <span className="text-slate-200">{formatValueWithColons(item)}</span>
            </div>
          ))}
        </div>
      </>
    )
  }

  if (isObject) {
    const obj = data as Record<string, unknown>
    const entries = Object.entries(obj)
    return (
      <>
      {title && (
        <div className="px-3 py-2 bg-slate-800 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-sm font-semibold text-slate-200">{title} <span className="text-slate-400">({Object.keys(obj).length})</span></h2>
        </div>
      )}
      {!hideExport && (
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 border-b border-slate-700 flex-shrink-0">
          <div className="flex-1" />
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-emerald-800 hover:bg-emerald-700 text-emerald-200 transition"
          >
            <FileText size={13} />
            CSV
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-green-800 hover:bg-green-700 text-green-200 transition"
          >
            <Download size={13} />
            Excel
          </button>
        </div>
      )}
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-slate-800 border-b border-slate-600">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300 border-r border-slate-700">Anahtar</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Değer</th>
          </tr>
        </thead>
        <tbody>
          {entries.flatMap(([key, value]) => {
            const isExpanded = expandedCells.has(key)
            const mainRow = (
              <tr key={`row-${key}`} className="border-b border-slate-700 hover:bg-slate-800/70">
                <td className="px-3 py-2 text-xs font-mono text-blue-300 border-r border-slate-700">{key}</td>
                <td className="px-3 py-2 text-xs font-mono text-slate-200">
                  {isNested(value) ? (
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => toggleExpand(key)}
                        className="text-blue-400 hover:text-blue-300 transition p-0.5"
                        title={`${key} ${getNestedInfo(value)} - İçe aç`}
                      >
                        {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                      </button>
                      <button
                        onClick={() => setNested({ title: key, data: value })}
                        className="text-blue-400 hover:text-blue-300 transition p-0.5"
                        title={`${key} ${getNestedInfo(value)} - Popup'ta aç`}
                      >
                        <Eye size={10} />
                      </button>
                      <span className="font-mono text-xs truncate">{key} {getNestedInfo(value)}</span>
                    </div>
                  ) : value === null ? (
                    <span className="text-slate-500 italic">null</span>
                  ) : value === undefined ? (
                    <span className="text-slate-600">—</span>
                  ) : typeof value === 'boolean' ? (
                    <span className={value ? 'text-green-400' : 'text-red-400'}>{String(value)}</span>
                  ) : typeof value === 'number' ? (
                    <span className="text-amber-400">{String(value)}</span>
                  ) : (
                    <span className="text-slate-200">{String(value)}</span>
                  )}
                </td>
              </tr>
            )

            const expandedRow = isExpanded && isNested(value) ? (
              <tr key={`exp-${key}`} className="bg-slate-900/40 border-b border-slate-700">
                <td colSpan={2} className="p-0">
                  <div className="border-l-2 border-blue-500 ml-2 pl-3 py-2">
                    <InlineExpand data={value} depth={0} onOpenModal={(title, data) => setNested({ title, data })} />
                  </div>
                </td>
              </tr>
            ) : null

            return expandedRow ? [mainRow, expandedRow] : [mainRow]
          })}
        </tbody>
      </table>
      {nested && (
        <NestedModal
          title={nested.title}
          data={nested.data}
          onClose={() => setNested(null)}
        />
      )}
      </>
    )
  }

  return (
    <div className="py-4 px-4 font-mono text-sm text-slate-200">
      {formatValueWithColons(data)}
    </div>
  )
}
