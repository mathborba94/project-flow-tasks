import { getCurrentUserWithOrg } from '@/services/auth'
import { getTaskById } from '@/services/task'
import Link from 'next/link'
import { ArrowLeft, Clock, User, Calendar, Flag, Hash, DollarSign } from 'lucide-react'

const statusConfig: Record<string, { label: string; className: string }> = {
  TODO: { label: 'A Fazer', className: 'bg-slate-100 text-slate-700' },
  IN_PROGRESS: { label: 'Em Progresso', className: 'bg-blue-50 text-blue-700' },
  IN_REVIEW: { label: 'Em Revisão', className: 'bg-amber-50 text-amber-700' },
  DONE: { label: 'Concluído', className: 'bg-emerald-50 text-emerald-700' },
  CANCELLED: { label: 'Cancelado', className: 'bg-red-50 text-red-700' },
}

const priorityConfig: Record<string, { label: string; className: string }> = {
  LOW: { label: 'Baixa', className: 'bg-slate-100 text-slate-600' },
  MEDIUM: { label: 'Média', className: 'bg-blue-50 text-blue-700' },
  HIGH: { label: 'Alta', className: 'bg-orange-50 text-orange-700' },
  URGENT: { label: 'Urgente', className: 'bg-red-50 text-red-700' },
}

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let organizationId = 'demo-org'
  try {
    const { organizationId: orgId } = await getCurrentUserWithOrg()
    organizationId = orgId
  } catch {}

  const task = await getTaskById(organizationId, id)

  if (!task) {
    return (
      <div className="p-8">
        <div className="text-center py-16">
          <p className="text-muted text-lg">Tarefa não encontrada</p>
          <Link href="/dashboard/tasks" className="text-brand hover:underline mt-2 inline-block">
            ← Voltar para Tarefas
          </Link>
        </div>
      </div>
    )
  }

  const status = statusConfig[task.status] || statusConfig.TODO
  const priority = priorityConfig[task.priority] || priorityConfig.MEDIUM

  return (
    <div className="p-8">
      <div className="mb-6 animate-fade-in">
        <Link href="/dashboard/tasks" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Voltar para Tarefas
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{task.title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 bg-surface rounded-xl border border-border shadow-card p-6 animate-fade-in">
          <h2 className="font-semibold text-foreground mb-3">Descrição</h2>
          {task.description ? (
            <p className="text-muted leading-relaxed whitespace-pre-wrap">{task.description}</p>
          ) : (
            <p className="text-muted/60 italic">Nenhuma descrição adicionada</p>
          )}
        </div>

        {/* Sidebar info */}
        <div className="space-y-4 animate-fade-in-delay">
          {/* Status & Priority */}
          <div className="bg-surface rounded-xl border border-border shadow-card p-5">
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">Informações</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted">
                  <Hash className="w-4 h-4" />
                  <span className="text-sm">Status</span>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.className}`}>
                  {status.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted">
                  <Flag className="w-4 h-4" />
                  <span className="text-sm">Prioridade</span>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${priority.className}`}>
                  {priority.label}
                </span>
              </div>
            </div>
          </div>

          {/* Assignment */}
          <div className="bg-surface rounded-xl border border-border shadow-card p-5">
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">Atribuição</h3>
            <div className="space-y-3">
              {task.assignedTo && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted" />
                  <span className="text-sm text-foreground">{task.assignedTo.name}</span>
                </div>
              )}
              {task.project && (
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-muted" />
                  <Link href={`/dashboard/projects/${task.project.id}`} className="text-sm text-brand hover:underline">
                    {task.project.name}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Time info */}
          <div className="bg-surface rounded-xl border border-border shadow-card p-5">
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">Datas</h3>
            <div className="space-y-2 text-sm text-muted">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Criado em: {new Date(task.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
              {task.completedAt && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Concluído em: {new Date(task.completedAt).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
