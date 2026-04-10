'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2, Clock, AlertCircle, Circle, AlertTriangle,
  FileText, MessageSquare, Users, BarChart3, Calendar,
  GanttChartSquare, ExternalLink, Download, Zap,
} from 'lucide-react'
import GanttChart from '@/components/project/gantt'

interface PublicProjectClientProps {
  project: {
    id: string
    name: string
    description: string | null
    color: string
    status: string
    type: string
    startDate: string | null
    endDate: string | null
    targetEndDate: string | null
    budget: number | null
    owner: { id: string; name: string }
    organization: { name: string; logoUrl: string | null; logoShape: string }
    pipeline: {
      stages: { id: string; name: string; color: string | null; order: number }[]
    } | null
  }
  stats: {
    totalTasks: number
    doneTasks: number
    inProgressTasks: number
    progress: number
    overdueTasks: number
  }
  tasks: {
    id: string
    title: string
    description: string | null
    status: string
    priority: string
    dueDate: string | null
    createdAt: string
    completedAt: string | null
    assignedTo: { id: string; name: string } | null
    pipelineStageId: string | null
    stageName: string | undefined
  }[]
  documents: {
    id: string
    title: string
    fileUrl: string
    fileType: string
    createdAt: string
  }[]
  comments: {
    id: string
    content: string
    createdAt: string
    author: { id: string; name: string }
  }[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  ACTIVE:    { label: 'Ativo',     color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  PAUSED:    { label: 'Pausado',   color: 'text-amber-400',   bg: 'bg-amber-500/10',   icon: AlertCircle },
  COMPLETED: { label: 'Concluído', color: 'text-zinc-400',    bg: 'bg-zinc-800',       icon: CheckCircle2 },
}

const TASK_STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  TODO:        { label: 'A Fazer',      color: 'text-zinc-400',    icon: Circle },
  IN_PROGRESS: { label: 'Em Progresso', color: 'text-blue-400',    icon: Clock },
  IN_REVIEW:   { label: 'Em Revisão',   color: 'text-amber-400',   icon: AlertCircle },
  DONE:        { label: 'Concluído',    color: 'text-emerald-400', icon: CheckCircle2 },
  CANCELLED:   { label: 'Cancelado',    color: 'text-red-400',     icon: AlertCircle },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  LOW:    { label: 'Baixa',   color: 'text-zinc-500' },
  MEDIUM: { label: 'Média',   color: 'text-blue-400' },
  HIGH:   { label: 'Alta',    color: 'text-orange-400' },
  URGENT: { label: 'Urgente', color: 'text-red-400' },
}

const DOC_TYPE_LABELS: Record<string, string> = {
  SCOPE:      'Escopo',
  CONTRACT:   'Contrato',
  ATTACHMENT: 'Anexo',
  OTHER:      'Outro',
}

type Tab = 'overview' | 'gantt' | 'tasks' | 'documents' | 'comments'

export default function PublicProjectClient({
  project,
  stats,
  tasks,
  documents,
  comments,
}: PublicProjectClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [taskFilter, setTaskFilter] = useState<string>('all')

  const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.ACTIVE
  const StatusIcon = statusCfg.icon

  const filteredTasks = taskFilter === 'all'
    ? tasks
    : tasks.filter(t => t.status === taskFilter)

  const today = new Date()

  const tabs: { id: Tab; label: string; icon: any; count?: number }[] = [
    { id: 'overview',   label: 'Visão Geral',  icon: BarChart3 },
    { id: 'gantt',      label: 'Gantt',         icon: GanttChartSquare },
    { id: 'tasks',      label: 'Tarefas',       icon: CheckCircle2, count: stats.totalTasks },
    { id: 'documents',  label: 'Documentos',    icon: FileText, count: documents.length },
    { id: 'comments',   label: 'Comentários',   icon: MessageSquare, count: comments.length },
  ]

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Header */}
      <div className="border-b border-zinc-800/60 bg-[#09090b]/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {/* Org logo or brand */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {project.organization.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={project.organization.logoUrl}
                    alt={project.organization.name}
                    className="h-6 object-contain"
                  />
                ) : (
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Zap className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-semibold text-zinc-300">{project.organization.name}</span>
                  </div>
                )}
              </div>
              <span className="text-zinc-700">/</span>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
                <h1 className="text-sm font-semibold text-zinc-100 truncate">{project.name}</h1>
                <span className={`hidden sm:inline text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${statusCfg.bg} ${statusCfg.color}`}>
                  {statusCfg.label}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500 flex-shrink-0">
              <span className="hidden md:block tabular-nums">{stats.progress}% concluído</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-2 w-full bg-zinc-800/40 rounded-full h-1">
            <div
              className="h-1 rounded-full bg-emerald-500 transition-all"
              style={{ width: `${stats.progress}%` }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex gap-0 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-zinc-400 text-zinc-200'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="text-[10px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-full tabular-nums">
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4">
                <p className="text-[11px] text-zinc-500 mb-1">Progresso</p>
                <p className="text-2xl font-semibold text-zinc-100 tabular-nums">{stats.progress}%</p>
                <div className="mt-2 w-full bg-zinc-800/40 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${stats.progress}%` }} />
                </div>
              </div>
              <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4">
                <p className="text-[11px] text-zinc-500 mb-1">Tarefas</p>
                <p className="text-2xl font-semibold text-zinc-100 tabular-nums">{stats.doneTasks}<span className="text-base text-zinc-600">/{stats.totalTasks}</span></p>
                <p className="text-[11px] text-zinc-500 mt-1">concluídas</p>
              </div>
              <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4">
                <p className="text-[11px] text-zinc-500 mb-1">Em Andamento</p>
                <p className="text-2xl font-semibold text-blue-400 tabular-nums">{stats.inProgressTasks}</p>
                <p className="text-[11px] text-zinc-500 mt-1">em progresso</p>
              </div>
              <div className={`bg-zinc-950/50 border rounded-lg p-4 ${stats.overdueTasks > 0 ? 'border-red-500/30' : 'border-zinc-800/60'}`}>
                <p className="text-[11px] text-zinc-500 mb-1">Atrasadas</p>
                <p className={`text-2xl font-semibold tabular-nums ${stats.overdueTasks > 0 ? 'text-red-400' : 'text-zinc-100'}`}>
                  {stats.overdueTasks}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">com prazo vencido</p>
              </div>
            </div>

            {/* Project info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-5">
                <h3 className="text-xs font-medium text-zinc-300 mb-3">Informações do Projeto</h3>
                <div className="space-y-3">
                  {project.description && (
                    <div>
                      <p className="text-[11px] text-zinc-500 mb-1">Descrição</p>
                      <p className="text-sm text-zinc-300 leading-relaxed">{project.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[11px] text-zinc-500 mb-0.5">Responsável</p>
                      <p className="text-sm text-zinc-300">{project.owner.name}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-zinc-500 mb-0.5">Tipo</p>
                      <p className="text-sm text-zinc-300">
                        {project.type === 'SCOPE_FIXED' ? 'Escopo Fechado' : 'Contínuo'}
                      </p>
                    </div>
                    {project.startDate && (
                      <div>
                        <p className="text-[11px] text-zinc-500 mb-0.5">Início</p>
                        <p className="text-sm text-zinc-300 tabular-nums">
                          {new Date(project.startDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    )}
                    {(project.endDate || project.targetEndDate) && (
                      <div>
                        <p className="text-[11px] text-zinc-500 mb-0.5">Prazo</p>
                        <p className="text-sm text-zinc-300 tabular-nums">
                          {new Date(project.endDate || project.targetEndDate!).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tasks by status breakdown */}
              <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-5">
                <h3 className="text-xs font-medium text-zinc-300 mb-3">Distribuição de Tarefas</h3>
                <div className="space-y-2.5">
                  {Object.entries(TASK_STATUS_CONFIG).map(([key, cfg]) => {
                    const count = tasks.filter(t => t.status === key).length
                    if (count === 0) return null
                    const Icon = cfg.icon
                    const pct = stats.totalTasks > 0 ? Math.round((count / stats.totalTasks) * 100) : 0
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                            <span className="text-xs text-zinc-400">{cfg.label}</span>
                          </div>
                          <span className="text-xs tabular-nums text-zinc-500">{count} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-zinc-800/40 rounded-full h-1">
                          <div className="h-1 rounded-full bg-zinc-600 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Pipeline stages */}
            {project.pipeline && project.pipeline.stages.length > 0 && (
              <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-5">
                <h3 className="text-xs font-medium text-zinc-300 mb-3">Etapas do Fluxo</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {project.pipeline.stages.map((stage, i) => {
                    const stageTaskCount = tasks.filter(t => t.pipelineStageId === stage.id).length
                    return (
                      <div key={stage.id} className="flex items-center gap-2">
                        {i > 0 && <div className="w-6 h-px bg-zinc-700" />}
                        <div className="flex items-center gap-1.5 bg-zinc-900/60 border border-zinc-800/60 rounded-md px-3 py-1.5">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: stage.color || '#71717a' }}
                          />
                          <span className="text-xs text-zinc-300">{stage.name}</span>
                          <span className="text-[10px] text-zinc-600 tabular-nums ml-1">{stageTaskCount}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Gantt Tab */}
        {activeTab === 'gantt' && (
          <div className="animate-fade-in">
            <div className="mb-4">
              <h2 className="text-sm font-medium text-zinc-200">Cronograma de Tarefas</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Visualização do progresso ao longo do tempo</p>
            </div>
            <GanttChart
              tasks={tasks}
              stages={project.pipeline?.stages || []}
              projectStartDate={project.startDate}
              projectEndDate={project.endDate}
              projectTargetEndDate={project.targetEndDate}
            />
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-medium text-zinc-200">Tarefas</h2>
                <p className="text-xs text-zinc-500 mt-0.5">{stats.totalTasks} tarefas no total</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={taskFilter}
                  onChange={e => setTaskFilter(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
                >
                  <option value="all">Todos os status</option>
                  {Object.entries(TASK_STATUS_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              {filteredTasks.length === 0 ? (
                <div className="py-12 text-center">
                  <CheckCircle2 className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-sm text-zinc-500">Nenhuma tarefa encontrada</p>
                </div>
              ) : (
                filteredTasks.map(task => {
                  const cfg = TASK_STATUS_CONFIG[task.status] || TASK_STATUS_CONFIG.TODO
                  const pCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM
                  const Icon = cfg.icon
                  const isOverdue = task.dueDate && new Date(task.dueDate) < today && task.status !== 'DONE' && task.status !== 'CANCELLED'
                  return (
                    <div
                      key={task.id}
                      className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4 hover:border-zinc-700/60 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm text-zinc-200 font-medium leading-snug">{task.title}</p>
                            <span className={`text-[10px] ${pCfg.color} flex-shrink-0`}>{pCfg.label}</span>
                          </div>
                          {task.description && (
                            <p className="text-xs text-zinc-500 mt-1 leading-relaxed line-clamp-2">{task.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            {task.stageName && (
                              <span className="text-[10px] text-zinc-500 bg-zinc-900/60 px-2 py-0.5 rounded">
                                {task.stageName}
                              </span>
                            )}
                            {task.assignedTo && (
                              <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                                <Users className="w-3 h-3" />
                                <span>{task.assignedTo.name}</span>
                              </div>
                            )}
                            {task.dueDate && (
                              <div className={`flex items-center gap-1 text-[11px] ${isOverdue ? 'text-red-400' : 'text-zinc-500'}`}>
                                <Calendar className="w-3 h-3" />
                                <span className="tabular-nums">
                                  {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                                  {isOverdue && ' (atrasada)'}
                                </span>
                              </div>
                            )}
                            {task.completedAt && (
                              <div className="flex items-center gap-1 text-[11px] text-emerald-500">
                                <CheckCircle2 className="w-3 h-3" />
                                <span className="tabular-nums">
                                  Concluída em {new Date(task.completedAt).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="animate-fade-in">
            <div className="mb-4">
              <h2 className="text-sm font-medium text-zinc-200">Documentos</h2>
              <p className="text-xs text-zinc-500 mt-0.5">{documents.length} documentos disponíveis</p>
            </div>

            {documents.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">Nenhum documento disponível</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {documents.map(doc => (
                  <a
                    key={doc.id}
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4 hover:border-zinc-700/60 transition-colors flex items-center gap-3 group"
                  >
                    <div className="w-10 h-10 bg-zinc-800/60 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200 truncate font-medium">{doc.title}</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        {DOC_TYPE_LABELS[doc.fileType] || doc.fileType} ·{' '}
                        {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors flex-shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Comments Tab */}
        {activeTab === 'comments' && (
          <div className="animate-fade-in">
            <div className="mb-4">
              <h2 className="text-sm font-medium text-zinc-200">Comentários</h2>
              <p className="text-xs text-zinc-500 mt-0.5">{comments.length} comentários</p>
            </div>

            {comments.length === 0 ? (
              <div className="py-12 text-center">
                <MessageSquare className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">Nenhum comentário ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map(comment => {
                  const initials = comment.author.name
                    .split(' ')
                    .map(n => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()
                  return (
                    <div key={comment.id} className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-semibold text-white">{initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-zinc-300">{comment.author.name}</span>
                            <span className="text-[10px] text-zinc-600 tabular-nums">
                              {new Date(comment.createdAt).toLocaleDateString('pt-BR', {
                                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-800/40 mt-12 py-6">
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex items-center justify-between">
          <p className="text-[11px] text-zinc-600">
            Página compartilhável · {project.organization.name}
          </p>
          <Link href="/" className="flex items-center gap-1.5 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors">
            <Zap className="w-3 h-3 text-violet-500" />
            ProjectFlow
          </Link>
        </div>
      </div>
    </div>
  )
}
