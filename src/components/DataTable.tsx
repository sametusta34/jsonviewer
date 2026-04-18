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

export default function DataTable({ rows }: Props) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [nested, setNested] = useState<NestedState | null>(null)
  const [showFilters, setShowFilters] = useState(false)

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
            const formatted = formatValueWithColons(val)
            return (
              <button
                className="nested-badge group"
                onClick={() => openNested(`${row.original.key}`, val)}
                title="Tıklayarak aç"
              >
                <Filter size={10} className="opacity-0 group-hover:opacity-100" />
                <span className="font-mono text-xs truncate">{formatted}</span>
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
