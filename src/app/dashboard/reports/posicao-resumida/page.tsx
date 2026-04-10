'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Filter } from 'lucide-react'

const statusConfig: Record<string, { label: string; className: string }> = {
  TODO:        { label: 'A Fazer',      className: 'bg-zinc-800 text-zinc-400' },
  IN_PROGRESS: { label: 'Em Progresso', className: 'bg-blue-500/10 text-blue-400' },
  IN_REVIEW:   { label: 'Em Revisão',   className: 'bg-amber-500/10 text-amber-400' },
  DONE:        { label: 'Concluído',    className: 'bg-emerald-500/10 text-emerald-400' },
  CANCELLED:   { label: 'Cancelado',    className: 'bg-red-500/10 text-red-400' },
}

const priorityConfig: Record<string, { label: string }> = {
  LOW:    { label: 'Baixa' },
  MEDIUM: { label: 'Média' },
  HIGH:   { label: 'Alta' },
  URGENT: { label: 'Urgente' },
}

export default function PosicaoResumidaPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const loadData = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ type: 'summary' })
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)

    fetch(`/api/reports?${params}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [startDate, endDate])

  useEffect(() => { loadData() }, [loadData])

  const hasFilters = startDate || endDate
  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
  }

  const projects: any[] = data?.projects || []
  const tasks: any[] = data?.tasks || []
  const tasksByStatus: Record<string, number> = data?.tasksByStatus || {}
  const tasksByPriority: Record<string, number> = data?.tasksByPriority || {}
  const totalHours = data?.totalHours || 0
  const totalCost = data?.totalCost || 0
  const completionRate = data?.completionRate || 0

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6 animate-fade-in">
        <Link href="/dashboard/reports" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-2 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar aos relatórios
        </Link>
        <h1 className="text-base font-semibold text-zinc-100 tracking-tight">Posição Resumida</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Análise geral da operação</p>
      </div>

      {/* Period filter */}
      <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4 mb-6 animate-fade-in">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-xs font-medium text-zinc-400">Filtro de período</span>
          {hasFilters && (
            <button onClick={clearFilters} className="ml-auto text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors">
              Limpar período
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="text-[11px] text-zinc-500 mb-1 block">De</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700"
            />
          </div>
          <div>
            <label className="text-[11px] text-zinc-500 mb-1 block">Até</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700"
            />
          </div>
          {hasFilters && (
            <div className="self-end pb-0.5">
              <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md">
                Dados filtrados por período de lançamento de horas e criação de tarefas
              </span>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center"><p className="text-sm text-zinc-500">Carregando...</p></div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Projetos', value: projects.length },
              { label: 'Tarefas', value: tasks.length },
              { label: 'Horas', value: `${Math.round(totalHours)}h` },
              { label: 'Custo', value: `R$ ${Math.round(totalCost).toLocaleString('pt-BR')}` },
            ].map((stat, i) => (
              <div key={stat.label} className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                <p className="text-xs text-zinc-500 mb-1">{stat.label}</p>
                <p className="text-xl font-semibold text-zinc-100 tracking-tight tabular-nums">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Extra stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4">
              <p className="text-xs text-zinc-500 mb-1">Taxa de conclusão</p>
              <p className="text-xl font-semibold text-emerald-400 tabular-nums">{completionRate}%</p>
            </div>
            <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4">
              <p className="text-xs text-zinc-500 mb-1">Em progresso</p>
              <p className="text-xl font-semibold text-blue-400 tabular-nums">{tasksByStatus['IN_PROGRESS'] || 0}</p>
            </div>
            <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4">
              <p className="text-xs text-zinc-500 mb-1">Canceladas</p>
              <p className="text-xl font-semibold text-red-400 tabular-nums">{tasksByStatus['CANCELLED'] || 0}</p>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Projects */}
            <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4">
              <h2 className="text-sm font-medium text-zinc-200 mb-3">Projetos</h2>
              <div className="space-y-px">
                {projects.map((project: any) => (
                  <div key={project.id} className="flex justify-between items-center py-2 px-2 rounded hover:bg-zinc-900/40 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color || '#5c6ac4' }} />
                      <div>
                        <p className="text-xs text-zinc-300 font-medium">{project.name}</p>
                        <p className="text-[11px] text-zinc-600">{project._count.tasks} tarefas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-300 tabular-nums">{Math.round(project.totalHours || 0)}h</p>
                      <p className="text-[11px] text-zinc-600">R$ {Math.round(project.totalCost || 0).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                ))}
                {projects.length === 0 && <p className="text-xs text-zinc-700 text-center py-6">Nenhum projeto</p>}
              </div>
            </div>

            {/* Status */}
            <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4">
              <h2 className="text-sm font-medium text-zinc-200 mb-3">Tarefas por status</h2>
              <div className="space-y-2">
                {Object.entries(tasksByStatus).map(([status, count]) => {
                  const config = statusConfig[status] || statusConfig.TODO
                  const pct = tasks.length > 0 ? Math.round((Number(count) / tasks.length) * 100) : 0
                  return (
                    <div key={status}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${config.className}`}>{config.label}</span>
                        <span className="text-xs text-zinc-400 tabular-nums">{String(count)}</span>
                      </div>
                      <div className="w-full bg-zinc-800/40 rounded-full h-1">
                        <div className="h-1 rounded-full bg-zinc-600 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
                {Object.keys(tasksByStatus).length === 0 && <p className="text-xs text-zinc-700 text-center py-6">Nenhuma tarefa</p>}
              </div>
            </div>

            {/* Priority */}
            <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4">
              <h2 className="text-sm font-medium text-zinc-200 mb-3">Tarefas por prioridade</h2>
              <div className="space-y-px">
                {Object.entries(tasksByPriority).map(([priority, count]) => {
                  const config = priorityConfig[priority] || { label: priority }
                  return (
                    <div key={priority} className="flex justify-between items-center py-2 px-2 rounded hover:bg-zinc-900/40 transition-colors">
                      <span className="text-xs text-zinc-500">{config.label}</span>
                      <span className="text-xs text-zinc-300 font-medium tabular-nums">{String(count)}</span>
                    </div>
                  )
                })}
                {Object.keys(tasksByPriority).length === 0 && <p className="text-xs text-zinc-700 text-center py-6">Nenhuma tarefa</p>}
              </div>
            </div>

            {/* Placeholder for task types (not in summary endpoint) */}
            <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4">
              <h2 className="text-sm font-medium text-zinc-200 mb-3">Distribuição de horas</h2>
              <div className="space-y-px">
                {projects.filter((p: any) => p.totalHours > 0).map((p: any) => {
                  const pct = totalHours > 0 ? Math.round((p.totalHours / totalHours) * 100) : 0
                  return (
                    <div key={p.id}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-zinc-400">{p.name}</span>
                        <span className="text-xs text-zinc-400 tabular-nums">{Math.round(p.totalHours)}h ({pct}%)</span>
                      </div>
                      <div className="w-full bg-zinc-800/40 rounded-full h-1 mb-2">
                        <div className="h-1 rounded-full bg-blue-500/60 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
                {projects.filter((p: any) => p.totalHours > 0).length === 0 && (
                  <p className="text-xs text-zinc-700 text-center py-6">Nenhuma hora registrada</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
