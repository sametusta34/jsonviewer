import { useState, useMemo, useRef, useEffect } from 'react'
import { formatValueWithColons } from '../utils/jsonUtils'
import { X, Filter, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

interface ColonViewProps {
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

export default function ColonView({ data }: ColonViewProps) {
  const [columnFilters, setColumnFilters] = useState<Record<string, ColumnFilter>>({})
  const [sort, setSort] = useState<SortState | null>(null)
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null)
  const [filterPos, setFilterPos] = useState({ top: 0, left: 0 })
  const filterRef = useRef<HTMLDivElement>(null)
  const filterButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

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

  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
    const items = data as Record<string, unknown>[]
    const allKeys = new Set<string>()
    items.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item as Record<string, unknown>).forEach(k => allKeys.add(k))
      }
    })
    const keys = Array.from(allKeys)

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

    const filteredItems = useMemo(() => {
      return items.filter(item => {
        return Object.entries(columnFilters).every(([key, filter]) => {
          const value = (item as Record<string, unknown>)[key]
          const displayValue = getDisplayValue(value)
          return applyFilter(displayValue, filter)
        })
      })
    }, [columnFilters])

    const sortedItems = useMemo(() => {
      if (!sort) return filteredItems

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
    }, [filteredItems, sort])

    const hasActiveFilters = Object.keys(columnFilters).length > 0

    return (
      <div className="flex flex-col h-full">
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
                {keys.map(key => (
                  <th
                    key={key}
                    className="px-3 py-2 text-left text-xs font-semibold text-slate-300 border-r border-slate-700 last:border-r-0 relative group"
                  >
                    <div className="flex items-center gap-1">
                      <span className="truncate">{key}</span>
                      <div className="flex gap-0.5">
                        {/* Sort buttons */}
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

                        {/* Filter button */}
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
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={keys.length} className="px-3 py-4 text-center text-slate-500 text-xs">
                    Sonuç bulunamadı
                  </td>
                </tr>
              ) : (
                sortedItems.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-700 hover:bg-slate-800/70">
                    {keys.map(key => {
                      const value = (item as Record<string, unknown>)[key]
                      const display = getDisplayValue(value)

                      return (
                        <td
                          key={`${idx}-${key}`}
                          className="px-3 py-2 text-xs font-mono text-slate-200 border-r border-slate-700 last:border-r-0 break-words max-w-xs"
                        >
                          {display}
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
    )
  }

  if (Array.isArray(data)) {
    return (
      <div className="bg-slate-800 rounded">
        {data.map((item, idx) => (
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
    )
  }

  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>
    return (
      <div className="bg-slate-800 rounded">
        {Object.entries(obj).map(([key, value]) => (
          <div
            key={key}
            className="py-2 px-4 border-b border-slate-700 last:border-b-0 font-mono text-sm"
          >
            <span className="text-blue-300">{key}</span>
            <span className="text-slate-400">: </span>
            <span className="text-slate-200">{formatValueWithColons(value)}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="py-4 px-4 font-mono text-sm text-slate-200">
      {formatValueWithColons(data)}
    </div>
  )
}
