'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckSquare, Plus } from 'lucide-react'
import TaskDetailModal from '@/components/task/detail-modal'

interface Task {
  id: string
  title: string
  status: string
  priority: string
  project: { id: string; name: string } | null
  taskType: { id: string; name: string } | null
  assignedTo: { id: string; name: string } | null
  sla: { breached: boolean } | null
}

const statusConfig: Record<string, { label: string; className: string }> = {
  TODO: { label: 'A Fazer', className: 'dark:bg-zinc-800 bg-zinc-200 dark:text-zinc-400 text-zinc-600' },
  IN_PROGRESS: { label: 'Em Progresso', className: 'bg-blue-500/10 text-blue-400' },
  IN_REVIEW: { label: 'Em Revisão', className: 'bg-amber-500/10 text-amber-400' },
  DONE: { label: 'Concluído', className: 'bg-emerald-500/10 text-emerald-400' },
  CANCELLED: { label: 'Cancelado', className: 'bg-red-500/10 text-red-400' },
}

const priorityConfig: Record<string, { label: string; className: string }> = {
  LOW: { label: 'Baixa', className: 'dark:text-zinc-600 text-zinc-400' },
  MEDIUM: { label: 'Média', className: 'text-blue-400' },
  HIGH: { label: 'Alta', className: 'text-orange-400' },
  URGENT: { label: 'Urgente', className: 'text-red-400' },
}

export default function TaskList({
  tasks: initialTasks,
  action,
}: {
  tasks: Task[]
  action?: React.ReactNode
}) {
  const [tasks] = useState(initialTasks)
  const [showTaskDetail, setShowTaskDetail] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const openTaskDetail = (taskId: string) => {
    setSelectedTaskId(taskId)
    setShowTaskDetail(true)
  }

  const handleTaskUpdate = () => {
    // Could refetch tasks here if needed
  }

  return (
    <>
      <div className="dark:bg-zinc-950/50 bg-white dark:border-zinc-800/60 border-zinc-200 rounded-lg overflow-hidden">
        <div className="divide-y dark:divide-zinc-800/40 divide-zinc-200/50 divide-zinc-200">
          {tasks.map((task, i) => {
            const status = statusConfig[task.status] || statusConfig.TODO
            const priority = priorityConfig[task.priority] || priorityConfig.MEDIUM
            return (
              <div
                key={task.id}
                onClick={() => openTaskDetail(task.id)}
                className="flex items-center justify-between px-4 py-3 dark:hover:bg-zinc-900/40 hover:bg-zinc-50 transition-colors group cursor-pointer"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {task.project && (
                      <span className="text-[11px] dark:text-zinc-600 text-zinc-400">{task.project.name}</span>
                    )}
                    {task.taskType && (
                      <span className="text-[11px] dark:text-zinc-700 text-zinc-500 dark:bg-zinc-800/60 bg-zinc-100 px-1.5 py-0.5 rounded">{task.taskType.name}</span>
                    )}
                  </div>
                  <p className="text-sm dark:text-zinc-300 text-zinc-700 group-dark:hover:text-zinc-100 group-hover:text-zinc-900 transition-colors truncate">{task.title}</p>
                  {task.assignedTo && (
                    <p className="text-[11px] dark:text-zinc-600 text-zinc-400 mt-0.5">{task.assignedTo.name}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${status.className}`}>
                    {status.label}
                  </span>
                  <span className={`text-[11px] font-medium ${priority.className}`}>
                    {priority.label}
                  </span>
                  {task.sla && (
                    <span className={`text-[11px] font-medium ${task.sla.breached ? 'text-red-400' : 'dark:text-zinc-600 text-zinc-400'}`}>
                      {task.sla.breached ? 'SLA expirado' : 'SLA OK'}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-16">
            <div className="w-10 h-10 dark:bg-zinc-900 bg-zinc-100 dark:border-zinc-800 border-zinc-300 rounded-lg flex items-center justify-center mx-auto mb-3">
              <CheckSquare className="w-5 h-5 dark:text-zinc-700 text-zinc-400" />
            </div>
            <p className="text-sm dark:text-zinc-500 text-zinc-500">Nenhuma tarefa ainda</p>
            <p className="text-xs dark:text-zinc-700 text-zinc-400 mt-1">Crie sua primeira tarefa para começar</p>
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        open={showTaskDetail}
        onOpenChange={setShowTaskDetail}
        taskId={selectedTaskId}
        initialTask={null}
        onUpdate={handleTaskUpdate}
        taskIds={tasks.map(t => t.id)}
        stages={undefined}
      />
    </>
  )
}
