'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, Calendar, User, FolderKanban } from 'lucide-react'

const statusLabels: Record<string, string> = {
  TODO: 'A Fazer',
  IN_PROGRESS: 'Em Progresso',
  IN_REVIEW: 'Em Revisão',
}

const priorityColors: Record<string, string> = {
  LOW: 'bg-zinc-800 text-zinc-400',
  MEDIUM: 'bg-blue-500/10 text-blue-400',
  HIGH: 'bg-orange-500/10 text-orange-400',
  URGENT: 'bg-red-500/10 text-red-400',
}

const priorityLabels: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  URGENT: 'Urgente',
}

export default function TarefasAtrasadasPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'>('all')

  useEffect(() => {
    fetch('/api/reports?type=overdue-tasks')
      .then(r => r.json())
      .then(data => setTasks(data.tasks || []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.priority === filter)
  const urgentCount = tasks.filter(t => t.priority === 'URGENT').length
  const highCount = tasks.filter(t => t.priority === 'HIGH').length

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6 animate-fade-in">
        <Link href="/dashboard/reports" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-2 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar aos relatórios
        </Link>
        <h1 className="text-base font-semibold text-zinc-100 tracking-tight">Tarefas Atrasadas</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Tarefas com data de vencimento passada e não concluídas</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4 animate-fade-in-delay">
        <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs text-zinc-500">Total Atrasadas</span>
          </div>
          <p className="text-xl font-semibold text-red-400 tabular-nums">{tasks.length}</p>
        </div>
        <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4">
          <p className="text-xs text-zinc-500 mb-1">Urgentes</p>
          <p className="text-xl font-semibold text-red-400 tabular-nums">{urgentCount}</p>
        </div>
        <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4">
          <p className="text-xs text-zinc-500 mb-1">Alta Prioridade</p>
          <p className="text-xl font-semibold text-orange-400 tabular-nums">{highCount}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-3 animate-fade-in-delay">
        {(['all', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              filter === f
                ? 'bg-zinc-700 text-zinc-200'
                : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {f === 'all' ? 'Todas' : priorityLabels[f]}
          </button>
        ))}
      </div>

      {/* Tasks list */}
      <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg animate-fade-in-delay-2">
        {loading ? (
          <div className="p-8 text-center"><p className="text-sm text-zinc-500">Carregando...</p></div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <AlertTriangle className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">Nenhuma tarefa atrasada encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/30">
            {filtered.map(task => {
              const daysOverdue = task.dueDate
                ? Math.floor((Date.now() - new Date(task.dueDate).getTime()) / 86400000)
                : 0
              return (
                <div key={task.id} className="flex items-center justify-between px-4 py-3 hover:bg-zinc-900/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${priorityColors[task.priority]}`}>
                        {priorityLabels[task.priority]}
                      </span>
                      <span className="text-xs text-zinc-300 font-medium truncate">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                      {task.project && (
                        <span className="flex items-center gap-1">
                          <FolderKanban className="w-3 h-3" />
                          {task.project.name}
                        </span>
                      )}
                      {task.assignedTo && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {task.assignedTo.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-red-400">
                        <Calendar className="w-3 h-3" />
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : '-'}
                        ({daysOverdue}d atraso)
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-zinc-500 bg-zinc-800/60 px-2 py-0.5 rounded-full">
                    {statusLabels[task.status] || task.status}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
