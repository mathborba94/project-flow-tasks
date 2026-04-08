'use client'

import { useState, useEffect } from 'react'
import { Download, Clock, DollarSign, Calendar } from 'lucide-react'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function MyHoursPage() {
  const [month, setMonth] = useState(getCurrentMonth())
  const [selectedProject, setSelectedProject] = useState('')
  const [projects, setProjects] = useState<any[]>([])
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/projects')
      .then(r => {
        if (!r.ok) return []
        return r.json()
      })
      .then(data => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setProjects([]))
  }, [])

  useEffect(() => {
    if (!month) return
    setLoading(true)
    const params = new URLSearchParams({ month })
    if (selectedProject) params.set('projectId', selectedProject)

    fetch(`/api/my-hours?${params}`)
      .then(r => r.json())
      .then(data => {
        setEntries(data.entries || [])
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [month, selectedProject])

  const totalMinutes = entries.reduce((sum, e) => sum + (e.minutes || 0), 0)
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10
  const totalCost = entries.reduce((sum, e) => sum + Number(e.costSnapshot || 0), 0)

  const handleExportCSV = () => {
    if (entries.length === 0) return
    const headers = ['Data', 'Tarefa', 'Projeto', 'Minutos', 'Horas', 'Descrição']
    const rows = entries.map(e => [
      new Date(e.createdAt).toLocaleDateString('pt-BR'),
      e.task?.title || '-',
      e.project?.name || '-',
      e.minutes,
      (e.minutes / 60).toFixed(2),
      `"${(e.description || '').replace(/"/g, '""')}"`,
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `minhas_horas_${month}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const [yearStr, monthStr] = month.split('-')
  const monthLabel = monthStr ? MONTHS[parseInt(monthStr, 10) - 1] : ''

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-base font-semibold text-zinc-100 tracking-tight">Minhas Horas</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Registros de tempo por período</p>
      </div>

      {/* Filters */}
      <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4 mb-4 animate-fade-in">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-[11px] text-zinc-500 mb-1 block">Mês</label>
            <select
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700"
            >
              {(() => {
                const now = new Date()
                const options = []
                for (let i = 0; i < 12; i++) {
                  const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                  const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                  options.push(
                    <option key={val} value={val}>
                      {MONTHS[d.getMonth()]} {d.getFullYear()}
                    </option>
                  )
                }
                return options
              })()}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-zinc-500 mb-1 block">Projeto (opcional)</label>
            <select
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700"
            >
              <option value="">Todos</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={entries.length === 0}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 border border-zinc-800 px-3 py-1.5 rounded-md hover:bg-zinc-900 hover:text-zinc-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4 animate-fade-in-delay">
        <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-xs text-zinc-500">Total Horas</span>
          </div>
          <p className="text-xl font-semibold text-zinc-100 tabular-nums">{totalHours}h</p>
        </div>
        <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-xs text-zinc-500">Custo Total</span>
          </div>
          <p className="text-xl font-semibold text-zinc-100 tabular-nums">
            R$ {Math.round(totalCost).toLocaleString('pt-BR')}
          </p>
        </div>
        <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-xs text-zinc-500">Registros</span>
          </div>
          <p className="text-xl font-semibold text-zinc-100 tabular-nums">{entries.length}</p>
        </div>
      </div>

      {/* Entries table */}
      <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg animate-fade-in-delay-2">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-sm text-zinc-500">Carregando...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-zinc-500">Nenhum registro encontrado para {monthLabel}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800/60">
                  <th className="text-left px-4 py-2.5 text-[11px] text-zinc-500 font-medium">Data</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-zinc-500 font-medium">Tarefa</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-zinc-500 font-medium">Projeto</th>
                  <th className="text-right px-4 py-2.5 text-[11px] text-zinc-500 font-medium">Min</th>
                  <th className="text-right px-4 py-2.5 text-[11px] text-zinc-500 font-medium">Horas</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-zinc-500 font-medium">Descrição</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry.id} className="border-b border-zinc-800/30 hover:bg-zinc-900/40 transition-colors">
                    <td className="px-4 py-2.5 text-zinc-400 tabular-nums">
                      {new Date(entry.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-300 max-w-[200px] truncate">
                      {entry.task?.title || '-'}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-400">
                      {entry.project?.name || '-'}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-300 text-right tabular-nums">
                      {entry.minutes}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-300 text-right tabular-nums">
                      {(entry.minutes / 60).toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-500 max-w-[250px] truncate">
                      {entry.description || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
