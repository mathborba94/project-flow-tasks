'use client'

import { useState, useRef } from 'react'
import { Download, Upload, FileSpreadsheet, Check, AlertTriangle, X } from 'lucide-react'

export default function CsvImportExport({ projectId }: { projectId: string }) {
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ created: number; timeEntriesCreated: number; errors: any[] } | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const csvFileInputRef = useRef<HTMLInputElement>(null)
  const xlsxFileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    window.open(`/api/projects/${projectId}/tasks/export`, '_blank')
  }

  const handleCsvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportResult(null)
    setImportError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/projects/${projectId}/tasks/import`, {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setImportResult({ created: data.created, timeEntriesCreated: 0, errors: data.errors || [] })
      } else {
        const data = await res.json()
        setImportError(data.error || 'Erro ao importar')
      }
    } catch {
      setImportError('Erro ao processar arquivo')
    } finally {
      setImporting(false)
      if (csvFileInputRef.current) csvFileInputRef.current.value = ''
    }
  }

  const handleXlsxFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportResult(null)
    setImportError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/projects/${projectId}/tasks/import-xlsx`, {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setImportResult({ created: data.created, timeEntriesCreated: data.timeEntriesCreated || 0, errors: data.errors || [] })
      } else {
        const data = await res.json()
        setImportError(data.error || 'Erro ao importar')
      }
    } catch {
      setImportError('Erro ao processar arquivo')
    } finally {
      setImporting(false)
      if (xlsxFileInputRef.current) xlsxFileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-sm font-medium text-zinc-200 mb-1">Importar / Exportar Tarefas</h2>
        <p className="text-xs text-zinc-500">Gerencie suas tarefas em lote usando arquivos CSV ou Excel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Export Section */}
        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <Download className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-sm font-medium text-zinc-200">Exportar</h3>
          </div>
          <p className="text-xs text-zinc-500 mb-4">
            Baixe todas as tarefas do projeto em formato CSV para backup ou análise.
          </p>
          <button
            onClick={handleExport}
            className="w-full inline-flex items-center justify-center gap-2 text-xs font-medium bg-white text-black px-4 py-2 rounded-md hover:bg-zinc-200 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Baixar CSV
          </button>
        </div>

        {/* Import Section */}
        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Upload className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="text-sm font-medium text-zinc-200">Importar</h3>
          </div>

          {/* CSV Import */}
          <div>
            <p className="text-xs text-zinc-400 mb-2 font-medium">CSV (tarefas básicas)</p>
            <p className="text-[11px] text-zinc-600 mb-2 font-mono bg-zinc-900/60 rounded px-2 py-1 inline-block">
              Title,Description,Status,Priority,AssigneeEmail,TaskType,DueDate
            </p>
            <input
              ref={csvFileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCsvFileChange}
              disabled={importing}
              className="w-full text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-zinc-800 file:text-zinc-300 file:hover:bg-zinc-700 disabled:opacity-50 cursor-pointer"
            />
          </div>

          {/* XLSX Import */}
          <div>
            <p className="text-xs text-zinc-400 mb-2 font-medium">Excel (Pipefy - completo)</p>
            <p className="text-[11px] text-zinc-600 mb-2 font-mono bg-zinc-900/60 rounded px-2 py-1 inline-block">
              Codigo, Titulo, Horas executadas, Responsaveis, etc.
            </p>
            <input
              ref={xlsxFileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleXlsxFileChange}
              disabled={importing}
              className="w-full text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-zinc-800 file:text-zinc-300 file:hover:bg-zinc-700 disabled:opacity-50 cursor-pointer"
            />
            <p className="text-[11px] text-zinc-600 mt-1">
              Importa tarefas + histórico de horas executadas
            </p>
          </div>

          {importing && (
            <p className="text-xs text-zinc-500">Importando...</p>
          )}
        </div>
      </div>

      {/* Results */}
      {importResult && (
        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <Check className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-medium text-emerald-400">
              Importação concluída — {importResult.created} tarefas criadas
              {importResult.timeEntriesCreated > 0 && (
                <span className="text-emerald-400/70 ml-2">
                  ({importResult.timeEntriesCreated} registros de horas)
                </span>
              )}
            </h3>
          </div>
          {importResult.errors.length > 0 && (
            <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs text-red-400 mb-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                {importResult.errors.length} erro(s) na importação
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {importResult.errors.slice(0, 10).map((err: any, i: number) => (
                  <p key={i} className="text-[11px] text-red-400/70">
                    Linha {err.row}: <span className="text-zinc-300">{err.title}</span> — {err.error}
                  </p>
                ))}
                {importResult.errors.length > 10 && (
                  <p className="text-[11px] text-red-400/70">
                    +{importResult.errors.length - 10} mais...
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {importError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-2">
          <X className="w-4 h-4 text-red-400 mt-0.5" />
          <p className="text-sm text-red-400">{importError}</p>
        </div>
      )}
    </div>
  )
}
