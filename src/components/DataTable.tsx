import { useState, useMemo, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import { ChevronUp, ChevronDown, ChevronsUpDown, Filter, X, Eye, Calculator } from 'lucide-react'
import { isNested, formatCellValue, formatValueWithColons } from '../utils/jsonUtils'
import NestedModal from './NestedModal'

interface KeyValueRow {
  key: string
  value: unknown
}

interface Props {
  rows: KeyValueRow[]
}

interface NestedState {
  title: string
  data: unknown
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

export default function DataTable({ rows }: Props) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [nested, setNested] = useState<NestedState | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showStats, setShowStats] = useState(false)

  const openNested = useCallback((title: string, data: unknown) => {
    setNested({ title, data })
  }, [])

  const colDefs = useMemo<ColumnDef<KeyValueRow>[]>(
    () => [
      {
        id: 'key',
        accessorKey: 'key',
        header: 'Key',
        enableSorting: true,
        enableColumnFilter: true,
        cell: ({ getValue }) => {
          const key = getValue() as string
          return <span className="text-blue-300 font-mono text-sm">{key}</span>
        },
        size: 150,
      },
      {
        id: 'value',
        accessorKey: 'value',
        header: 'Value',
        enableSorting: true,
        enableColumnFilter: true,
        cell: ({ getValue, row }) => {
          const val = getValue()
          if (isNested(val)) {
            return (
              <button
                className="nested-badge group"
                onClick={() => openNested(`${row.original.key}`, val)}
                title="Tıklayarak aç"
              >
                <Eye size={10} className="opacity-0 group-hover:opacity-100" />
                <span className="font-mono text-xs truncate">{row.original.key} {getNestedInfo(val)}</span>
              </button>
            )
          }
          if (val === null) return <span className="text-slate-500 italic">null</span>
          if (val === undefined) return <span className="text-slate-600">—</span>
          if (typeof val === 'boolean')
            return <span className={val ? 'text-green-400' : 'text-red-400'}>{String(val)}</span>
          if (typeof val === 'number')
            return <span className="text-amber-400">{String(val)}</span>
          return <span className="text-slate-200">{String(val)}</span>
        },
        sortingFn: (a, b) => {
          const av = a.original.value
          const bv = b.original.value
          if (av == null && bv == null) return 0
          if (av == null) return 1
          if (bv == null) return -1
          if (typeof av === 'number' && typeof bv === 'number') return av - bv
          return String(av).localeCompare(String(bv))
        },
        filterFn: (row, _colId, filterValue) => {
          const val = formatCellValue(row.original.value)
          return val.toLowerCase().includes(String(filterValue).toLowerCase())
        },
      },
    ],
    [openNested]
  )

  const table = useReactTable({
    data: rows,
    columns: colDefs,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _colId, filterValue) => {
      const searchStr = String(filterValue).toLowerCase()
      return (
        row.original.key.toLowerCase().includes(searchStr) ||
        formatCellValue(row.original.value).toLowerCase().includes(searchStr)
      )
    },
  })

  const filteredCount = table.getFilteredRowModel().rows.length

  const valueStats = useMemo(() => {
    const numbers: number[] = []
    table.getFilteredRowModel().rows.forEach(row => {
      const val = row.original.value
      const num = typeof val === 'number' ? val : (typeof val === 'string' ? parseFloat(val) : null)
      if (num !== null && !isNaN(num)) {
        numbers.push(num)
      }
    })

    if (numbers.length === 0) return null

    const sum = numbers.reduce((a, b) => a + b, 0)
    const min = Math.min(...numbers)
    const max = Math.max(...numbers)
    const avg = sum / numbers.length

    return { min, max, sum, avg, count: numbers.length }
  }, [table.getFilteredRowModel().rows])

  return (
    <div className="flex flex-col h-full">
      {/* Table toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 border-b border-slate-700 flex-shrink-0 flex-wrap">
        {/* Global search */}
        <div className="relative">
          <input
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder="Tümünde ara…"
            className="bg-slate-700 text-slate-200 text-xs rounded px-8 py-1.5 outline-none border border-slate-600 focus:border-blue-500 w-48"
          />
          <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          {globalFilter && (
            <button onClick={() => setGlobalFilter('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
              <X size={11} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(f => !f)}
          className={`text-xs px-2.5 py-1.5 rounded flex items-center gap-1 transition ${showFilters ? 'bg-blue-700 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
        >
          <Filter size={11} />
          Sütun Filtreleri {showFilters ? '▲' : '▼'}
        </button>

        {(columnFilters.length > 0 || globalFilter) && (
          <button
            onClick={() => { setColumnFilters([]); setGlobalFilter('') }}
            className="text-xs px-2 py-1.5 rounded bg-red-900/50 hover:bg-red-900 text-red-300 flex items-center gap-1 transition"
          >
            <X size={11} /> Filtreleri Temizle
          </button>
        )}

        {valueStats && (
          <button
            onClick={() => setShowStats(!showStats)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-purple-800 hover:bg-purple-700 text-purple-200 transition"
            title="İstatistikler"
          >
            <Calculator size={13} />
            İstatistikler
          </button>
        )}

        <div className="flex-1" />
        <span className="text-xs text-slate-500">
          {filteredCount !== rows.length
            ? `${filteredCount} / ${rows.length} satır`
            : `${rows.length} satır`}
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="json-table">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(header => (
                  <th key={header.id} style={{ minWidth: header.id === 'key' ? 150 : 300 }}>
                    <div
                      className="flex items-center gap-1 cursor-pointer select-none"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <span className="truncate">{String(header.column.columnDef.header)}</span>
                      {header.column.getCanSort() && (
                        <span className="flex-shrink-0 text-slate-500">
                          {header.column.getIsSorted() === 'asc' ? (
                            <ChevronUp size={13} className="text-blue-400" />
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <ChevronDown size={13} className="text-blue-400" />
                          ) : (
                            <ChevronsUpDown size={13} />
                          )}
                        </span>
                      )}
                    </div>
                    {/* Column filter input */}
                    {showFilters && (
                      <div className="mt-1">
                        <input
                          value={(header.column.getFilterValue() as string) ?? ''}
                          onChange={e => header.column.setFilterValue(e.target.value)}
                          placeholder="Filtrele…"
                          className="w-full bg-slate-900 text-slate-300 text-xs px-2 py-1 rounded border border-slate-600 outline-none focus:border-blue-500"
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={2} className="text-center text-slate-500 py-8">
                  Sonuç bulunamadı
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Statistics modal */}
      {showStats && valueStats && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg shadow-2xl max-w-2xl w-full border border-slate-700">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-700">
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
              <div className="bg-slate-900/60 rounded-lg p-6 border border-slate-600">
                <div className="font-bold text-slate-100 mb-4 text-base border-b border-slate-700 pb-2">Değer Sütunu</div>
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Minimum:</span>
                    <span className="text-slate-100 font-mono text-lg">{valueStats.min.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Maximum:</span>
                    <span className="text-slate-100 font-mono text-lg">{valueStats.max.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Toplam:</span>
                    <span className="text-slate-100 font-mono text-lg">{valueStats.sum.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                    <span className="text-slate-400 font-semibold">Ortalama:</span>
                    <span className="text-amber-400 font-mono text-lg font-bold">{valueStats.avg.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nested modal */}
      {nested && (
        <NestedModal
          title={nested.title}
          data={nested.data}
          onClose={() => setNested(null)}
        />
      )}
    </div>
  )
}
