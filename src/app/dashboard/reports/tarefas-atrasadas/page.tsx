'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, Calendar, User, FolderKanban, Filter } from 'lucide-react'

const statusLabels: Record<string, string> = {
  TODO: 'A Fazer',
  IN_PROGRESS: 'Em Progresso',
  IN_REVIEW: 'Em Revisão',
}

const priorityColors: Record<string, string> = {
  LOW: 'dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-400 text-zinc-600',
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
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'>('all')
  const [projects, setProjects] = useState<any[]>([])
  const [projectFilter, setProjectFilter] = useState('')
  const [dueDateFrom, setDueDateFrom] = useState('')
  const [dueDateTo, setDueDateTo] = useState('')

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => setProjects(Array.isArray(data) ? data : data.projects || []))
      .catch(() => setProjects([]))
  }, [])

  const loadTasks = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ type: 'overdue-tasks' })
    if (projectFilter) params.set('projectId', projectFilter)
    if (dueDateFrom) params.set('dueDateFrom', dueDateFrom)
    if (dueDateTo) params.set('dueDateTo', dueDateTo)

    fetch(`/api/reports?${params}`)
      .then(r => r.json())
      .then(data => setTasks(data.tasks || []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false))
  }, [projectFilter, dueDateFrom, dueDateTo])

  useEffect(() => { loadTasks() }, [loadTasks])

  const filtered = priorityFilter === 'all' ? tasks : tasks.filter(t => t.priority === priorityFilter)
  const urgentCount = tasks.filter(t => t.priority === 'URGENT').length
  const highCount = tasks.filter(t => t.priority === 'HIGH').length

  const hasFilters = projectFilter || dueDateFrom || dueDateTo
  const clearFilters = () => {
    setProjectFilter('')
    setDueDateFrom('')
    setDueDateTo('')
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6 animate-fade-in">
        <Link href="/dashboard/reports" className="inline-flex items-center gap-1.5 text-xs dark:text-zinc-500 text-zinc-500 dark:hover:text-zinc-300 hover:text-zinc-700 mb-2 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar aos relatórios
        </Link>
        <h1 className="text-base font-semibold dark:text-zinc-100 text-zinc-900 tracking-tight">Tarefas Atrasadas</h1>
        <p className="text-sm dark:text-zinc-500 text-zinc-500 mt-0.5">Tarefas com data de vencimento passada e não concluídas</p>
      </div>

      {/* Period / Project Filters */}
      <div className="dark:bg-zinc-950/50 bg-white border dark:border-zinc-800 border-zinc-200 rounded-lg p-4 mb-4 animate-fade-in">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-3.5 h-3.5 dark:text-zinc-500 text-zinc-500" />
          <span className="text-xs font-medium dark:text-zinc-400 text-zinc-600">Filtros</span>
          {hasFilters && (
            <button onClick={clearFilters} className="ml-auto text-[11px] dark:text-zinc-500 text-zinc-500 dark:hover:text-zinc-300 hover:text-zinc-700 transition-colors">
              Limpar filtros
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] dark:text-zinc-500 text-zinc-500 mb-1 block">Projeto</label>
            <select
              value={projectFilter}
              onChange={e => setProjectFilter(e.target.value)}
              className="w-full dark:bg-zinc-900 bg-zinc-50 border dark:border-zinc-800 border-zinc-300 rounded-md px-3 py-1.5 text-sm dark:text-zinc-200 text-zinc-800 focus:outline-none focus:ring-1 dark:focus:ring-zinc-700 focus:ring-zinc-400"
            >
              <option value="">Todos os projetos</option>
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] dark:text-zinc-500 text-zinc-500 mb-1 block">Prazo a partir de</label>
            <input
              type="date"
              value={dueDateFrom}
              onChange={e => setDueDateFrom(e.target.value)}
              className="w-full dark:bg-zinc-900 bg-zinc-50 border dark:border-zinc-800 border-zinc-300 rounded-md px-3 py-1.5 text-sm dark:text-zinc-200 text-zinc-800 focus:outline-none focus:ring-1 dark:focus:ring-zinc-700 focus:ring-zinc-400"
            />
          </div>
          <div>
            <label className="text-[11px] dark:text-zinc-500 text-zinc-500 mb-1 block">Prazo até</label>
            <input
              type="date"
              value={dueDateTo}
              onChange={e => setDueDateTo(e.target.value)}
              className="w-full dark:bg-zinc-900 bg-zinc-50 border dark:border-zinc-800 border-zinc-300 rounded-md px-3 py-1.5 text-sm dark:text-zinc-200 text-zinc-800 focus:outline-none focus:ring-1 dark:focus:ring-zinc-700 focus:ring-zinc-400"
            />
          </div>
        </div>
        {(dueDateFrom || dueDateTo) && (
          <p className="text-[10px] dark:text-zinc-500 text-zinc-400 mt-2">
            Período personalizado ativo — mostrando tarefas com prazo no intervalo selecionado
          </p>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4 animate-fade-in">
        <div className="dark:bg-zinc-950/50 bg-white border dark:border-zinc-800 border-zinc-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs dark:text-zinc-500 text-zinc-500">Total Atrasadas</span>
          </div>
          <p className="text-xl font-semibold text-red-400 tabular-nums">{tasks.length}</p>
        </div>
        <div className="dark:bg-zinc-950/50 bg-white border dark:border-zinc-800 border-zinc-200 rounded-lg p-4">
          <p className="text-xs dark:text-zinc-500 text-zinc-500 mb-1">Urgentes</p>
          <p className="text-xl font-semibold text-red-400 tabular-nums">{urgentCount}</p>
        </div>
        <div className="dark:bg-zinc-950/50 bg-white border dark:border-zinc-800 border-zinc-200 rounded-lg p-4">
          <p className="text-xs dark:text-zinc-500 text-zinc-500 mb-1">Alta Prioridade</p>
          <p className="text-xl font-semibold text-orange-400 tabular-nums">{highCount}</p>
        </div>
      </div>

      {/* Priority filter tabs */}
      <div className="flex items-center gap-2 mb-3">
        {(['all', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'] as const).map(f => (
          <button
            key={f}
            onClick={() => setPriorityFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              priorityFilter === f
                ? 'dark:bg-zinc-700 bg-zinc-200 dark:text-zinc-200 text-zinc-800'
                : 'dark:bg-zinc-800/60 bg-zinc-100 dark:text-zinc-500 text-zinc-500 dark:hover:text-zinc-300 hover:text-zinc-700'
            }`}
          >
            {f === 'all' ? 'Todas' : priorityLabels[f]}
          </button>
        ))}
      </div>

      {/* Tasks list */}
      <div className="dark:bg-zinc-950/50 bg-white border dark:border-zinc-800 border-zinc-200 rounded-lg">
        {loading ? (
          <div className="p-8 text-center"><p className="text-sm dark:text-zinc-500 text-zinc-500">Carregando...</p></div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <AlertTriangle className="w-8 h-8 dark:text-zinc-700 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm dark:text-zinc-500 text-zinc-500">Nenhuma tarefa encontrada com os filtros selecionados</p>
          </div>
        ) : (
          <div className="divide-y dark:divide-zinc-800/30 divide-zinc-200/50">
            {filtered.map(task => {
              const daysOverdue = task.dueDate
                ? Math.floor((Date.now() - new Date(task.dueDate).getTime()) / 86400000)
                : 0
              return (
                <div key={task.id} className="flex items-center justify-between px-4 py-3 dark:hover:bg-zinc-900/40 hover:bg-zinc-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${priorityColors[task.priority]}`}>
                        {priorityLabels[task.priority]}
                      </span>
                      <span className="text-xs dark:text-zinc-300 text-zinc-700 font-medium truncate">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] dark:text-zinc-500 text-zinc-500 flex-wrap">
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
                        {daysOverdue > 0 && ` (${daysOverdue}d atraso)`}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] dark:text-zinc-500 text-zinc-500 dark:bg-zinc-800/60 bg-zinc-100 px-2 py-0.5 rounded-full ml-2">
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
