'use client'

import { useState, useEffect } from 'react'
import { Calendar, ArrowRight, User, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'

export type TaskHistoryEventType =
  | 'created'
  | 'stage_changed'
  | 'status_changed'
  | 'assignee_changed'
  | 'completed'
  | 'priority_changed'
  | 'title_changed'

export interface TaskHistoryEntry {
  id: string
  type: TaskHistoryEventType
  description: string
  createdAt: string
  createdBy: { id: string; name: string } | null
  metadata?: Record<string, unknown>
}

interface TaskHistoryLogProps {
  taskId: string
  entries?: TaskHistoryEntry[]
}

const eventTypeConfig: Record<TaskHistoryEventType, {
  icon: React.ElementType
  iconColor: string
  bgColor: string
  defaultLabel: string
}> = {
  created: {
    icon: Calendar,
    iconColor: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    defaultLabel: 'Tarefa criada',
  },
  stage_changed: {
    icon: ArrowRight,
    iconColor: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    defaultLabel: 'Estagio alterado',
  },
  status_changed: {
    icon: Clock,
    iconColor: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    defaultLabel: 'Status alterado',
  },
  assignee_changed: {
    icon: User,
    iconColor: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    defaultLabel: 'Responsavel alterado',
  },
  completed: {
    icon: CheckCircle2,
    iconColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    defaultLabel: 'Tarefa concluida',
  },
  priority_changed: {
    icon: AlertTriangle,
    iconColor: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    defaultLabel: 'Prioridade alterada',
  },
  title_changed: {
    icon: Clock,
    iconColor: 'text-zinc-400',
    bgColor: 'bg-zinc-500/10',
    defaultLabel: 'Titulo alterado',
  },
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'agora mesmo'
  if (diffMins < 60) return `${diffMins}min atras`
  if (diffHours < 24) return `${diffHours}h atras`
  if (diffDays < 7) return `${diffDays}d atras`

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Mock data for development - will be replaced by API call
function generateMockHistory(taskId: string): TaskHistoryEntry[] {
  const now = new Date()
  return [
    {
      id: '1',
      type: 'created',
      description: 'Tarefa criada',
      createdAt: new Date(now.getTime() - 7 * 86400000).toISOString(),
      createdBy: { id: 'user-1', name: 'Joao Silva' },
    },
    {
      id: '2',
      type: 'assignee_changed',
      description: 'Atribuido a Maria Santos',
      createdAt: new Date(now.getTime() - 6 * 86400000).toISOString(),
      createdBy: { id: 'user-1', name: 'Joao Silva' },
      metadata: { assigneeName: 'Maria Santos' },
    },
    {
      id: '3',
      type: 'stage_changed',
      description: "Movido de 'A Fazer' para 'Em Progresso'",
      createdAt: new Date(now.getTime() - 5 * 86400000).toISOString(),
      createdBy: { id: 'user-2', name: 'Maria Santos' },
      metadata: { from: 'A Fazer', to: 'Em Progresso' },
    },
    {
      id: '4',
      type: 'priority_changed',
      description: "Prioridade alterada de 'Media' para 'Alta'",
      createdAt: new Date(now.getTime() - 3 * 86400000).toISOString(),
      createdBy: { id: 'user-1', name: 'Joao Silva' },
      metadata: { from: 'MEDIUM', to: 'HIGH' },
    },
    {
      id: '5',
      type: 'stage_changed',
      description: "Movido de 'Em Progresso' para 'Em Revisao'",
      createdAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
      createdBy: { id: 'user-2', name: 'Maria Santos' },
      metadata: { from: 'Em Progresso', to: 'Em Revisao' },
    },
    {
      id: '6',
      type: 'completed',
      description: 'Tarefa marcada como concluida',
      createdAt: new Date(now.getTime() - 3600000).toISOString(),
      createdBy: { id: 'user-1', name: 'Joao Silva' },
    },
  ]
}

export default function TaskHistoryLog({ taskId, entries }: TaskHistoryLogProps) {
  const [history, setHistory] = useState<TaskHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (entries) {
      setHistory(entries)
      setLoading(false)
      return
    }

    fetch(`/api/tasks/${taskId}/history`)
      .then(r => r.json())
      .then(data => {
        // Map API response to our interface
        const mapped = data.map((item: any) => ({
          id: item.id,
          type: item.eventType.toLowerCase() as TaskHistoryEventType,
          description: item.description,
          createdAt: item.createdAt,
          createdBy: item.createdBy,
          metadata: item.metadata,
        }))
        setHistory(mapped)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [taskId, entries])

  if (loading) {
    return (
      <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg">
        <div className="px-4 py-3 border-b border-zinc-800/40">
          <h3 className="text-sm font-medium text-zinc-200">Historico</h3>
        </div>
        <div className="px-4 py-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 bg-zinc-800 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-zinc-800 rounded w-3/4" />
                <div className="h-3 bg-zinc-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg">
        <div className="px-4 py-3 border-b border-zinc-800/40">
          <h3 className="text-sm font-medium text-zinc-200">Historico</h3>
        </div>
        <div className="px-4 py-12 text-center">
          <Clock className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">Nenhum registro ainda</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg">
      <div className="px-4 py-3 border-b border-zinc-800/40">
        <h3 className="text-sm font-medium text-zinc-200">Historico</h3>
      </div>

      <div className="px-4 py-4">
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-4 top-2 bottom-2 w-px bg-zinc-800" />

          <div className="space-y-4">
            {history.map((entry, index) => {
              const config = eventTypeConfig[entry.type] || eventTypeConfig.created
              const Icon = config.icon

              return (
                <div key={entry.id} className="relative flex gap-3 group">
                  {/* Timeline dot */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center ring-4 ring-zinc-950`}>
                      <Icon className={`w-4 h-4 ${config.iconColor}`} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-zinc-300 truncate">
                          {entry.description}
                        </p>
                        {entry.createdBy && (
                          <p className="text-xs text-zinc-500 mt-0.5">
                            por {entry.createdBy.name}
                          </p>
                        )}
                      </div>

                      {/* Date tooltip */}
                      <div
                        className="flex-shrink-0 text-[11px] text-zinc-600 group-hover:text-zinc-400 transition-colors cursor-default"
                        title={formatFullDate(entry.createdAt)}
                      >
                        {formatRelativeDate(entry.createdAt)}
                      </div>
                    </div>

                    {/* Metadata details */}
                    {entry.metadata && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {entry.metadata.from && entry.metadata.to && (
                          <>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-zinc-800 text-zinc-400">
                              {String(entry.metadata.from)}
                            </span>
                            <ArrowRight className="w-3 h-3 text-zinc-600" />
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-zinc-800 text-zinc-300">
                              {String(entry.metadata.to)}
                            </span>
                          </>
                        )}
                        {entry.metadata.assigneeName && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-cyan-500/10 text-cyan-400">
                            <User className="w-3 h-3 mr-1" />
                            {String(entry.metadata.assigneeName)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
