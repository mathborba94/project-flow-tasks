'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Clock, DollarSign, Filter } from 'lucide-react'
import Link from 'next/link'

export default function HoursReportClient({
  projects,
  users,
}: {
  projects: any[]
  users: any[]
}) {
  const [projectId, setProjectId] = useState(projects[0]?.id || '')
  const [userId, setUserId] = useState('')
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    const params = new URLSearchParams()
    params.set('type', 'hours-consumption')
    params.set('projectId', projectId)
    if (userId) params.set('userId', userId)
    params.set('startDate', startDate)
    params.set('endDate', endDate)

    fetch(`/api/reports?${params}`)
      .then(r => r.json())
      .then(data => setEntries(data.entries || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [projectId, userId, startDate, endDate])

  const totalMinutes = entries.reduce((sum, e) => sum + (e.minutes || 0), 0)
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10
  const totalCost = entries.reduce((sum, e) => sum + Number(e.costSnapshot || 0), 0)

  // Group by user
  const byUser = entries.reduce((acc, e) => {
    const uid = e.userId
    if (!acc[uid]) {
      acc[uid] = { user: e.user, minutes: 0, cost: 0, count: 0 }
    }
    acc[uid].minutes += e.minutes
    acc[uid].cost += Number(e.costSnapshot || 0)
    acc[uid].count += 1
    return acc
  }, {} as Record<string, any>)

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6 animate-fade-in">
        <Link href="/dashboard/reports" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-2 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar aos relatórios
        </Link>
        <h1 className="text-base font-semibold text-zinc-100 tracking-tight">Consumo de Horas</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Horas registradas por período</p>
      </div>

      {/* Filters */}
      <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4 mb-4 animate-fade-in">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-300">Filtros</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] text-zinc-500 mb-1 block">Projeto *</label>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700"
            >
              <option value="">Selecione</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-zinc-500 mb-1 block">Usuário (opcional)</label>
            <select
              value={userId}
              onChange={e => setUserId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700"
            >
              <option value="">Todos</option>
              {users.map(u => (
                <option key={u.id} value={u.user?.id || u.id}>{u.user?.name || u.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-zinc-500 mb-1 block">De</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700"
            />
          </div>
          <div>
            <label className="text-[11px] text-zinc-500 mb-1 block">Até</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700"
            />
          </div>
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
          <p className="text-xl font-semibold text-zinc-100 tabular-nums">R$ {Math.round(totalCost).toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-zinc-500">Registros</span>
          </div>
          <p className="text-xl font-semibold text-zinc-100 tabular-nums">{entries.length}</p>
        </div>
      </div>

      {/* By User */}
      <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4 mb-4 animate-fade-in-delay">
        <h2 className="text-sm font-medium text-zinc-200 mb-3">Horas por Usuário</h2>
        <div className="space-y-px">
          {Object.values(byUser).map((u: any, i) => (
            <div key={i} className="flex justify-between items-center py-2 px-2 rounded hover:bg-zinc-900/40 transition-colors">
              <p className="text-xs text-zinc-300 font-medium">{u.user?.name || 'Desconhecido'}</p>
              <div className="flex items-center gap-4">
                <span className="text-xs text-zinc-400 tabular-nums">{u.count} registros</span>
                <span className="text-xs text-zinc-300 tabular-nums">{Math.round((u.minutes / 60) * 10) / 10}h</span>
                <span className="text-xs text-zinc-400 tabular-nums">R$ {Math.round(u.cost).toLocaleString('pt-BR')}</span>
              </div>
            </div>
          ))}
          {Object.keys(byUser).length === 0 && !loading && (
            <p className="text-xs text-zinc-600 text-center py-6">Nenhum registro encontrado</p>
          )}
        </div>
      </div>

      {/* Entries table */}
      <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg animate-fade-in-delay-2">
        {loading ? (
          <div className="p-8 text-center"><p className="text-sm text-zinc-500">Carregando...</p></div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center"><p className="text-sm text-zinc-500">Nenhum registro encontrado</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800/60">
                  <th className="text-left px-4 py-2.5 text-[11px] text-zinc-500 font-medium">Data</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-zinc-500 font-medium">Usuário</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-zinc-500 font-medium">Tarefa</th>
                  <th className="text-right px-4 py-2.5 text-[11px] text-zinc-500 font-medium">Min</th>
                  <th className="text-right px-4 py-2.5 text-[11px] text-zinc-500 font-medium">Horas</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-zinc-500 font-medium">Descrição</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry.id} className="border-b border-zinc-800/30 hover:bg-zinc-900/40 transition-colors">
                    <td className="px-4 py-2.5 text-zinc-400 tabular-nums">{new Date(entry.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-2.5 text-zinc-300">{entry.user?.name || '-'}</td>
                    <td className="px-4 py-2.5 text-zinc-400 max-w-[200px] truncate">{entry.task?.title || '-'}</td>
                    <td className="px-4 py-2.5 text-zinc-300 text-right tabular-nums">{entry.minutes}</td>
                    <td className="px-4 py-2.5 text-zinc-300 text-right tabular-nums">{(entry.minutes / 60).toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-zinc-500 max-w-[250px] truncate">{entry.description || '-'}</td>
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
