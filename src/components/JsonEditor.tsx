import React, { useCallback, useRef } from 'react'
import { Upload, FileJson, X, CheckCircle, AlertCircle } from 'lucide-react'

interface Props {
  value: string
  onChange: (v: string) => void
  error: string | null
  errorLine?: number
  errorCol?: number
  isValid: boolean
}

export default function JsonEditor({ value, onChange, error, isValid }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => onChange(ev.target?.result as string)
    reader.readAsText(file)
    e.target.value = ''
  }, [onChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => onChange(ev.target?.result as string)
    reader.readAsText(file)
  }, [onChange])

  const handleFormat = useCallback(() => {
    try {
      onChange(JSON.stringify(JSON.parse(value), null, 2))
    } catch {}
  }, [value, onChange])

  const handleMinify = useCallback(() => {
    try {
      onChange(JSON.stringify(JSON.parse(value)))
    } catch {}
  }, [value, onChange])

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 border-b border-slate-700 flex-shrink-0">
        <FileJson size={16} className="text-blue-400" />
        <span className="text-sm font-semibold text-slate-300">JSON Girişi</span>
        <div className="flex-1" />
        <button
          onClick={handleFormat}
          disabled={!value}
          className="text-xs px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 disabled:opacity-40 transition"
        >
          Biçimlendir
        </button>
        <button
          onClick={handleMinify}
          disabled={!value}
          className="text-xs px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 disabled:opacity-40 transition"
        >
          Sıkıştır
        </button>
        <button
          onClick={() => onChange('')}
          disabled={!value}
          className="text-xs px-2.5 py-1 rounded bg-slate-700 hover:bg-red-900 text-slate-300 disabled:opacity-40 transition"
        >
          <X size={13} />
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="text-xs px-2.5 py-1 rounded bg-blue-700 hover:bg-blue-600 text-white flex items-center gap-1 transition"
        >
          <Upload size={12} /> Dosya Yükle
        </button>
        <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFile} />
      </div>

      {/* Status bar */}
      {value && (
        <div className={`flex items-center gap-2 px-3 py-1 text-xs flex-shrink-0 ${isValid ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
          {isValid ? (
            <><CheckCircle size={12} /> Geçerli JSON</>
          ) : (
            <><AlertCircle size={12} /> {error}</>
          )}
        </div>
      )}

      {/* Textarea */}
      <div
        className="flex-1 relative"
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
      >
        {!value && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none text-slate-600 select-none">
            <Upload size={32} />
            <span className="text-sm">JSON yapıştırın veya dosya sürükleyin</span>
          </div>
        )}
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full h-full bg-transparent text-slate-200 font-mono text-sm p-3 resize-none outline-none leading-6"
          placeholder=""
          spellCheck={false}
        />
      </div>
    </div>
  )
}
