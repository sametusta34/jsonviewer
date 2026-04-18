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
import { ChevronUp, ChevronDown, ChevronsUpDown, Filter, X } from 'lucide-react'
import { isNested, formatCellValue } from '../utils/jsonUtils'
import NestedModal from './NestedModal'

interface Props {
  rows: Record<string, unknown>[]
  columns: string[]
}

interface NestedState {
  title: string
  data: unknown
}

export default function DataTable({ rows, columns }: Props) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [nested, setNested] = useState<NestedState | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const openNested = useCallback((title: string, data: unknown) => {
    setNested({ title, data })
  }, [])

  const colDefs = useMemo<ColumnDef<Record<string, unknown>>[]>(
    () =>
      columns.map(col => ({
        id: col,
        accessorKey: col,
        header: col,
        enableSorting: true,
        enableColumnFilter: true,
        cell: ({ getValue, row }) => {
          const val = getValue()
          if (isNested(val)) {
            const label = Array.isArray(val)
              ? `[Array ${(val as unknown[]).length}]`
              : `{${Object.keys(val as object).slice(0, 2).join(', ')}…}`
            return (
              <button
                className="nested-badge"
                onClick={() => openNested(`[${row.index}].${col}`, val)}
              >
                <Filter size={10} />
                {label}
              </button>
            )
          }
          if (val === null) return <span className="text-slate-500 italic">null</span>
          if (val === undefined) return <span className="text-slate-600">—</span>
          if (typeof val === 'boolean')
            return <span className={val ? 'text-green-400' : 'text-red-400'}>{String(val)}</span>
          if (typeof val === 'number')
            return <span className="text-amber-400">{String(val)}</span>
          return <span>{String(val)}</span>
        },
        sortingFn: (a, b, colId) => {
          const av = a.original[colId]
          const bv = b.original[colId]
          if (av == null && bv == null) return 0
          if (av == null) return 1
          if (bv == null) return -1
          if (typeof av === 'number' && typeof bv === 'number') return av - bv
          return String(av).localeCompare(String(bv))
        },
        filterFn: (row, colId, filterValue) => {
          const val = formatCellValue(row.original[colId])
          return val.toLowerCase().includes(String(filterValue).toLowerCase())
        },
      })),
    [columns, openNested]
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
      return Object.values(row.original).some(v =>
        formatCellValue(v).toLowerCase().includes(String(filterValue).toLowerCase())
      )
    },
  })

  const filteredCount = table.getFilteredRowModel().rows.length

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

        <div className="flex-1" />
        <span className="text-xs text-slate-500">
          {filteredCount !== rows.length
            ? `${filteredCount} / ${rows.length} satır`
            : `${rows.length} satır`}
          {' · '}{columns.length} sütun
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="json-table">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                <th className="text-slate-600 text-center w-10">#</th>
                {hg.headers.map(header => (
                  <th key={header.id} style={{ minWidth: 100 }}>
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
                <td colSpan={columns.length + 1} className="text-center text-slate-500 py-8">
                  Sonuç bulunamadı
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, idx) => (
                <tr key={row.id}>
                  <td className="text-slate-600 text-center text-xs">{idx + 1}</td>
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
