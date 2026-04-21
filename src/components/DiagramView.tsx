import { useState, useRef, useEffect } from 'react'
import { Plus, X, Download, FileImage } from 'lucide-react'
import html2canvas from 'html2canvas'
import { Relationship } from '../App'
import RelationshipModal from './RelationshipModal'

const BOX_WIDTH = 220
const BOX_HEADER_HEIGHT = 36
const ROW_HEIGHT = 28
const GRID_GAP_X = 80
const GRID_GAP_Y = 60
const PADDING = 40

interface DiagramViewProps {
  tables: Record<string, unknown>
  multiTableKeys: string[]
  relationships: Relationship[]
  onAddRelationship: (rel: Omit<Relationship, 'id'>) => void
  onRemoveRelationship: (id: string) => void
}

interface TablePosition {
  [tableName: string]: { x: number; y: number }
}

interface DragState {
  type: 'table' | 'column' | null
  tableName?: string
  colName?: string
  startX?: number
  startY?: number
}

function getTableColumns(tables: Record<string, unknown>, tableName: string): string[] {
  try {
    const data = tables[tableName]
    if (!Array.isArray(data) || data.length === 0) return []
    const first = data[0]
    if (typeof first !== 'object' || first === null) return []
    return Object.keys(first as Record<string, unknown>)
  } catch (e) {
    return []
  }
}

function getBoxHeight(cols: number): number {
  return BOX_HEADER_HEIGHT + cols * ROW_HEIGHT + 8
}

function getInitialPositions(tableKeys: string[], tables: Record<string, unknown>): TablePosition {
  const positions: TablePosition = {}
  const cols = Math.min(3, tableKeys.length)

  tableKeys.forEach((key, idx) => {
    const col = idx % cols
    const row = Math.floor(idx / cols)
    let maxHeight = 0

    for (let r = 0; r < row; r++) {
      let rowMax = 0
      for (let c = 0; c < cols; c++) {
        const tableIdx = r * cols + c
        if (tableIdx < tableKeys.length) {
          const colCount = getTableColumns(tables, tableKeys[tableIdx]).length
          rowMax = Math.max(rowMax, getBoxHeight(colCount))
        }
      }
      maxHeight += rowMax + GRID_GAP_Y
    }

    positions[key] = {
      x: PADDING + col * (BOX_WIDTH + GRID_GAP_X),
      y: PADDING + maxHeight,
    }
  })

  return positions
}

function TableBox({
  tableName,
  columns,
  x,
  y,
  relationships,
  onRemoveRelationship,
  onDragStart,
  onDragEnd,
  isDragging,
}: {
  tableName: string
  columns: string[]
  x: number
  y: number
  relationships: Relationship[]
  onRemoveRelationship: (id: string) => void
  onDragStart: (tableName: string, e: React.MouseEvent) => void
  onDragEnd: () => void
  isDragging: boolean
}) {
  const relatedCols = new Set(
    relationships
      .filter(r => r.fromTable === tableName || r.toTable === tableName)
      .flatMap(r => [r.fromCol, r.toCol])
  )

  return (
    <div
      className={`absolute bg-slate-800 border border-slate-600 rounded shadow-lg transition-opacity ${
        isDragging ? 'opacity-75' : ''
      }`}
      style={{ left: x, top: y, width: BOX_WIDTH, zIndex: 10 }}
      onMouseDown={e => onDragStart(tableName, e)}
      onMouseUp={onDragEnd}
      onMouseLeave={onDragEnd}
    >
      <div className="bg-blue-800 px-3 py-2 border-b border-slate-600 rounded-t font-bold text-white text-xs cursor-move hover:bg-blue-700 transition">
        {tableName}
      </div>
      <div className="py-1">
        {columns.length === 0 ? (
          <div className="px-3 py-2 text-xs text-slate-500">Kolon yok</div>
        ) : (
          columns.map((col, idx) => (
            <div
              key={idx}
              className={`px-3 py-1.5 text-xs font-mono border-b border-slate-700 last:border-b-0 cursor-grab active:cursor-grabbing ${
                relatedCols.has(col) ? 'text-blue-300 bg-slate-700' : 'text-slate-300 hover:bg-slate-700/50'
              }`}
              draggable
              onDragStart={e => {
                e.stopPropagation()
                e.dataTransfer!.effectAllowed = 'link'
                e.dataTransfer!.setData('application/json', JSON.stringify({ tableName, colName: col }))
              }}
              onDragOver={e => {
                e.preventDefault()
                e.dataTransfer!.dropEffect = 'link'
              }}
              onDrop={e => {
                e.preventDefault()
                e.stopPropagation()
                try {
                  const data = JSON.parse(e.dataTransfer!.getData('application/json'))
                  if (data.tableName && data.colName && data.tableName !== tableName) {
                    const relationship = {
                      fromTable: data.tableName,
                      fromCol: data.colName,
                      toTable: tableName,
                      toCol: col,
                    }
                    // Call the callback - it will be passed via parent
                    const event = new CustomEvent('add-relationship', { detail: relationship })
                    window.dispatchEvent(event)
                  }
                } catch (e) {
                  // Ignore invalid drag data
                }
              }}
            >
              {relatedCols.has(col) && <span className="text-blue-400 mr-1">●</span>}
              {col}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default function DiagramView({
  tables,
  multiTableKeys,
  relationships,
  onAddRelationship,
  onRemoveRelationship,
}: DiagramViewProps) {
  const [showModal, setShowModal] = useState(false)
  const [positions, setPositions] = useState<TablePosition>(() =>
    getInitialPositions(multiTableKeys, tables)
  )
  const [dragState, setDragState] = useState<DragState>({ type: null })
  const containerRef = useRef<HTMLDivElement>(null)
  const dragOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 })

  // Reset positions when multiTableKeys changes
  useEffect(() => {
    setPositions(getInitialPositions(multiTableKeys, tables))
  }, [multiTableKeys, tables])

  // Handle relationship addition via drag-drop
  useEffect(() => {
    const handleAddRelationship = (e: Event) => {
      const customEvent = e as CustomEvent
      try {
        onAddRelationship(customEvent.detail)
      } catch (error) {
        console.error('İlişki eklenirken hata:', error)
      }
    }
    window.addEventListener('add-relationship', handleAddRelationship)
    return () => window.removeEventListener('add-relationship', handleAddRelationship)
  }, [onAddRelationship])

  // Handle table dragging
  const handleTableDragStart = (tableName: string, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[draggable="true"]')) return

    const pos = positions[tableName]
    if (!pos) return

    setDragState({
      type: 'table',
      tableName,
      startX: e.clientX,
      startY: e.clientY,
    })
    dragOffsetRef.current = {
      dx: e.clientX - pos.x,
      dy: e.clientY - pos.y,
    }
  }

  const handleTableDragEnd = () => {
    setDragState({ type: null })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragState.type !== 'table' || !dragState.tableName) return

    const newPos = {
      x: e.clientX - dragOffsetRef.current.dx,
      y: e.clientY - dragOffsetRef.current.dy,
    }

    setPositions(prev => ({
      ...prev,
      [dragState.tableName!]: newPos,
    }))
  }

  const exportAsPNG = async () => {
    if (!containerRef.current) return
    try {
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: '#0f172a',
        scale: 2,
        logging: false,
      })
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `diagram-${new Date().toISOString().slice(0, 10)}.png`
      link.click()
    } catch (error) {
      console.error('PNG export hatası:', error)
    }
  }

  const exportAsSVG = () => {
    try {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('width', canvasWidth.toString())
      svg.setAttribute('height', canvasHeight.toString())
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

      // Background
      const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      bg.setAttribute('width', canvasWidth.toString())
      bg.setAttribute('height', canvasHeight.toString())
      bg.setAttribute('fill', '#0f172a')
      svg.appendChild(bg)

      // Lines/relationships
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker')
      marker.setAttribute('id', 'arrow')
      marker.setAttribute('markerWidth', '8')
      marker.setAttribute('markerHeight', '8')
      marker.setAttribute('refX', '6')
      marker.setAttribute('refY', '3')
      marker.setAttribute('orient', 'auto')
      marker.setAttribute('markerUnits', 'strokeWidth')
      const arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      arrowPath.setAttribute('d', 'M0,0 L0,6 L8,3 z')
      arrowPath.setAttribute('fill', '#60a5fa')
      marker.appendChild(arrowPath)
      defs.appendChild(marker)
      svg.appendChild(defs)

      // Draw relationships
      relationships.forEach(rel => {
        try {
          const fromPos = positions[rel.fromTable]
          const toPos = positions[rel.toTable]
          if (!fromPos || !toPos) return

          const fromCols = getTableColumns(tables, rel.fromTable)
          const toCols = getTableColumns(tables, rel.toTable)
          const fromColIdx = fromCols.indexOf(rel.fromCol)
          const toColIdx = toCols.indexOf(rel.toCol)

          if (fromColIdx === -1 || toColIdx === -1) return

          const fromY = fromPos.y + BOX_HEADER_HEIGHT + fromColIdx * ROW_HEIGHT + ROW_HEIGHT / 2
          const toY = toPos.y + BOX_HEADER_HEIGHT + toColIdx * ROW_HEIGHT + ROW_HEIGHT / 2
          const fromX = fromPos.x + BOX_WIDTH
          const toX = toPos.x

          const dx = Math.abs(toX - fromX) * 0.5
          let pathD: string
          if (fromPos.x < toPos.x) {
            pathD = `M ${fromX} ${fromY} C ${fromX + dx} ${fromY}, ${toX - dx} ${toY}, ${toX} ${toY}`
          } else {
            pathD = `M ${fromX} ${fromY} C ${fromX + 60} ${fromY}, ${toX + 60} ${toY}, ${toX} ${toY}`
          }

          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
          path.setAttribute('d', pathD)
          path.setAttribute('stroke', '#60a5fa')
          path.setAttribute('stroke-width', '1.5')
          path.setAttribute('fill', 'none')
          path.setAttribute('marker-end', 'url(#arrow)')
          svg.appendChild(path)
        } catch (e) {
          console.error('SVG line export error:', e)
        }
      })

      // Draw tables
      multiTableKeys.forEach(tableName => {
        const pos = positions[tableName]
        if (!pos) return
        const cols = getTableColumns(tables, tableName)

        // Table box
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')

        // Background
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        rect.setAttribute('x', pos.x.toString())
        rect.setAttribute('y', pos.y.toString())
        rect.setAttribute('width', BOX_WIDTH.toString())
        rect.setAttribute('height', getBoxHeight(cols.length).toString())
        rect.setAttribute('fill', '#1e293b')
        rect.setAttribute('stroke', '#475569')
        rect.setAttribute('rx', '4')
        g.appendChild(rect)

        // Header
        const headerRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        headerRect.setAttribute('x', pos.x.toString())
        headerRect.setAttribute('y', pos.y.toString())
        headerRect.setAttribute('width', BOX_WIDTH.toString())
        headerRect.setAttribute('height', BOX_HEADER_HEIGHT.toString())
        headerRect.setAttribute('fill', '#1e3a8a')
        headerRect.setAttribute('rx', '4')
        headerRect.setAttribute('ry', '4')
        g.appendChild(headerRect)

        // Title
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        title.setAttribute('x', (pos.x + 10).toString())
        title.setAttribute('y', (pos.y + 23).toString())
        title.setAttribute('font-size', '12')
        title.setAttribute('font-weight', 'bold')
        title.setAttribute('fill', '#ffffff')
        title.setAttribute('font-family', 'monospace')
        title.textContent = tableName
        g.appendChild(title)

        // Columns
        cols.forEach((col, idx) => {
          const colY = pos.y + BOX_HEADER_HEIGHT + idx * ROW_HEIGHT + 10

          const colText = document.createElementNS('http://www.w3.org/2000/svg', 'text')
          colText.setAttribute('x', (pos.x + 10).toString())
          colText.setAttribute('y', colY.toString())
          colText.setAttribute('font-size', '11')
          colText.setAttribute('fill', '#cbd5e1')
          colText.setAttribute('font-family', 'monospace')
          colText.textContent = col
          g.appendChild(colText)
        })

        svg.appendChild(g)
      })

      const svgString = new XMLSerializer().serializeToString(svg)
      const link = document.createElement('a')
      link.href = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString)
      link.download = `diagram-${new Date().toISOString().slice(0, 10)}.svg`
      link.click()
    } catch (error) {
      console.error('SVG export hatası:', error)
    }
  }

  // Calculate canvas size
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity

  Object.values(positions).forEach(pos => {
    minX = Math.min(minX, pos.x)
    maxX = Math.max(maxX, pos.x + BOX_WIDTH)
    minY = Math.min(minY, pos.y)
    maxY = Math.max(maxY, pos.y + 200) // Rough height estimate
  })

  const canvasWidth = Math.max(800, maxX + PADDING)
  const canvasHeight = Math.max(600, maxY + PADDING)

  // Render SVG paths
  const pathElements = relationships
    .map(rel => {
      try {
        const fromPos = positions[rel.fromTable]
        const toPos = positions[rel.toTable]
        if (!fromPos || !toPos) return null

        const fromCols = getTableColumns(tables, rel.fromTable)
        const toCols = getTableColumns(tables, rel.toTable)
        const fromColIdx = fromCols.indexOf(rel.fromCol)
        const toColIdx = toCols.indexOf(rel.toCol)

        if (fromColIdx === -1 || toColIdx === -1) return null

        const fromY = fromPos.y + BOX_HEADER_HEIGHT + fromColIdx * ROW_HEIGHT + ROW_HEIGHT / 2
        const toY = toPos.y + BOX_HEADER_HEIGHT + toColIdx * ROW_HEIGHT + ROW_HEIGHT / 2

        const fromX = fromPos.x + BOX_WIDTH
        const toX = toPos.x

        const dx = Math.abs(toX - fromX) * 0.5

        let pathD: string
        if (fromPos.x < toPos.x) {
          pathD = `M ${fromX} ${fromY} C ${fromX + dx} ${fromY}, ${toX - dx} ${toY}, ${toX} ${toY}`
        } else if (fromPos.x > toPos.x) {
          pathD = `M ${fromX} ${fromY} C ${fromX + 60} ${fromY}, ${toX + 60} ${toY}, ${toX} ${toY}`
        } else {
          pathD = `M ${fromX} ${fromY} C ${fromX + 60} ${fromY}, ${toX + 60} ${toY}, ${toX} ${toY}`
        }

        return (
          <g key={rel.id}>
            <path
              d={pathD}
              fill="none"
              stroke="transparent"
              strokeWidth="10"
              style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
              onClick={() => onRemoveRelationship(rel.id)}
            />
            <path
              d={pathD}
              fill="none"
              stroke="#60a5fa"
              strokeWidth="1.5"
              markerEnd="url(#arrow)"
              pointerEvents="none"
            />
          </g>
        )
      } catch (e) {
        console.error('Çizgi renderlanırken hata:', e)
        return null
      }
    })
    .filter(Boolean)

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700 flex-shrink-0">
        <span className="text-xs text-slate-400">
          {multiTableKeys.length} tablo, {relationships.length} ilişki
        </span>
        <div className="flex-1" />
        <button
          onClick={exportAsPNG}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-purple-800 hover:bg-purple-700 text-purple-200 transition"
          title="PNG olarak indir"
        >
          <Download size={13} />
          PNG
        </button>
        <button
          onClick={exportAsSVG}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-indigo-800 hover:bg-indigo-700 text-indigo-200 transition"
          title="SVG olarak indir"
        >
          <FileImage size={13} />
          SVG
        </button>
        <button
          onClick={() => setShowModal(true)}
          disabled={multiTableKeys.length < 2}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition ${
            multiTableKeys.length < 2
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-blue-800 hover:bg-blue-700 text-blue-200'
          }`}
          title={multiTableKeys.length < 2 ? 'İlişki eklemek için en az 2 tablo gereklidir' : ''}
        >
          <Plus size={13} />
          İlişki Ekle
        </button>
      </div>

      {/* Relationship chips */}
      {relationships.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 py-2 bg-slate-800 border-b border-slate-700 flex-shrink-0 max-h-16 overflow-y-auto">
          {relationships.map(rel => (
            <div
              key={rel.id}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-700 rounded text-xs text-slate-200 flex-shrink-0"
            >
              <span className="font-mono text-blue-300">
                {rel.fromTable}.{rel.fromCol} → {rel.toTable}.{rel.toCol}
              </span>
              <button
                onClick={() => onRemoveRelationship(rel.id)}
                className="text-slate-400 hover:text-red-400 transition"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto relative bg-slate-950 cursor-grab active:cursor-grabbing"
        style={{ background: '#0f172a' }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleTableDragEnd}
        onMouseLeave={handleTableDragEnd}
      >
        <div
          style={{
            width: canvasWidth,
            height: canvasHeight,
            position: 'relative',
          }}
        >
          {/* SVG overlay */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: canvasWidth,
              height: canvasHeight,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          >
            <defs>
              <marker
                id="arrow"
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L0,6 L8,3 z" fill="#60a5fa" />
              </marker>
            </defs>
            {pathElements}
          </svg>

          {/* Table boxes */}
          {multiTableKeys.map(tableName => {
            const pos = positions[tableName]
            if (!pos) return null
            const cols = getTableColumns(tables, tableName)
            return (
              <TableBox
                key={tableName}
                tableName={tableName}
                columns={cols}
                x={pos.x}
                y={pos.y}
                relationships={relationships}
                onRemoveRelationship={onRemoveRelationship}
                onDragStart={handleTableDragStart}
                onDragEnd={handleTableDragEnd}
                isDragging={dragState.tableName === tableName}
              />
            )
          })}
        </div>
      </div>

      {/* Relationship Modal */}
      {showModal && (
        <RelationshipModal
          tables={tables}
          multiTableKeys={multiTableKeys}
          onAdd={rel => {
            try {
              onAddRelationship(rel)
              setShowModal(false)
            } catch (error) {
              console.error('İlişki eklenirken hata:', error)
            }
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
