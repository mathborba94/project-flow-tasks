import { getCurrentUserWithOrg } from '@/services/auth'
import { listProjects } from '@/services/project'
import { listTasks, getTaskTypeStats } from '@/services/task'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const statusConfig: Record<string, { label: string; className: string }> = {
  TODO: { label: 'A Fazer', className: 'bg-zinc-800 text-zinc-400' },
  IN_PROGRESS: { label: 'Em Progresso', className: 'bg-blue-500/10 text-blue-400' },
  IN_REVIEW: { label: 'Em Revisão', className: 'bg-amber-500/10 text-amber-400' },
  DONE: { label: 'Concluído', className: 'bg-emerald-500/10 text-emerald-400' },
  CANCELLED: { label: 'Cancelado', className: 'bg-red-500/10 text-red-400' },
}

const priorityConfig: Record<string, { label: string }> = {
  LOW: { label: 'Baixa' },
  MEDIUM: { label: 'Média' },
  HIGH: { label: 'Alta' },
  URGENT: { label: 'Urgente' },
}

export default async function PosicaoResumidaPage() {
  let organizationId = 'demo-org'
  try {
    const { organizationId: orgId } = await getCurrentUserWithOrg()
    organizationId = orgId
  } catch {}

  const [projects, tasks, taskTypeStats] = await Promise.all([
    listProjects(organizationId),
    listTasks(organizationId),
    getTaskTypeStats(organizationId),
  ])

  const totalHours = projects.reduce((sum, p) => sum + (p.totalHours || 0), 0)
  const totalCost = projects.reduce((sum, p) => sum + (p.totalCost || 0), 0)

  const tasksByStatus = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const tasksByPriority = tasks.reduce((acc, t) => {
    acc[t.priority] = (acc[t.priority] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const completedTasks = tasks.filter(t => t.status === 'DONE').length
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0

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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Projetos', value: projects.length },
          { label: 'Tarefas', value: tasks.length },
          { label: 'Horas', value: `${Math.round(totalHours)}h` },
          { label: 'Custo', value: `R$ ${Math.round(totalCost).toLocaleString('pt-BR')}` },
        ].map((stat, i) => (
          <div key={stat.label} className={`bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4 animate-fade-in${i > 0 ? `-delay-${i}` : ''}`}>
            <p className="text-xs text-zinc-500 mb-1">{stat.label}</p>
            <p className="text-xl font-semibold text-zinc-100 tracking-tight tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Extra stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4 animate-fade-in-delay">
          <p className="text-xs text-zinc-500 mb-1">Taxa de conclusão</p>
          <p className="text-xl font-semibold text-emerald-400 tabular-nums">{completionRate}%</p>
        </div>
        <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4 animate-fade-in-delay-2">
          <p className="text-xs text-zinc-500 mb-1">Em progresso</p>
          <p className="text-xl font-semibold text-blue-400 tabular-nums">{tasks.filter(t => t.status === 'IN_PROGRESS').length}</p>
        </div>
        <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4 animate-fade-in-delay-3">
          <p className="text-xs text-zinc-500 mb-1">Canceladas</p>
          <p className="text-xl font-semibold text-red-400 tabular-nums">{tasks.filter(t => t.status === 'CANCELLED').length}</p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Projects */}
        <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4 animate-fade-in-delay">
          <h2 className="text-sm font-medium text-zinc-200 mb-3">Projetos</h2>
          <div className="space-y-px">
            {projects.map((project) => (
              <div key={project.id} className="flex justify-between items-center py-2 px-2 rounded hover:bg-zinc-900/40 transition-colors">
                <div>
                  <p className="text-xs text-zinc-300 font-medium">{project.name}</p>
                  <p className="text-[11px] text-zinc-600">{project._count.tasks} tarefas</p>
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
        <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4 animate-fade-in-delay-2">
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
        <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4 animate-fade-in-delay">
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

        {/* Task Types */}
        <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4 animate-fade-in-delay-2">
          <h2 className="text-sm font-medium text-zinc-200 mb-3">Tipos de tarefa</h2>
          <div className="space-y-px">
            {taskTypeStats.map((stat) => (
              <div key={stat.taskTypeId} className="flex justify-between items-center py-2 px-2 rounded hover:bg-zinc-900/40 transition-colors">
                <div>
                  <p className="text-xs text-zinc-300 font-medium">{stat.name}</p>
                  <p className="text-[11px] text-zinc-600">{stat.taskCount} tarefas · {stat.avgMinutes}min média</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-300 tabular-nums">{Math.round(stat.totalMinutes / 60)}h</p>
                  <p className="text-[11px] text-zinc-600">R$ {stat.totalCost}</p>
                </div>
              </div>
            ))}
            {taskTypeStats.length === 0 && <p className="text-xs text-zinc-700 text-center py-6">Nenhum dado</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
