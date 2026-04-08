'use client'

import { useState } from 'react'
import { Calendar, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import TaskDetailModal from '@/components/task/detail-modal'

function TaskCard({ task, statusLabels, priorityColors, priorityLabels, isOverdue, onClick }: any) {
  return (
    <div
      onClick={() => onClick(task.id)}
      className={`bg-zinc-950/50 border rounded-lg p-3 hover:border-zinc-700/60 transition-colors cursor-pointer group ${
        isOverdue ? 'border-red-500/30 hover:border-red-500/50' : 'border-zinc-800/60'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-xs text-zinc-300 group-hover:text-zinc-100 transition-colors line-clamp-2 flex-1">
          {task.title}
        </p>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${priorityColors[task.priority] || 'bg-zinc-800 text-zinc-400'}`}>
          {priorityLabels[task.priority]}
        </span>
      </div>
      <div className="flex items-center gap-3 text-[10px] text-zinc-500">
        {task.project && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
            {task.project.name}
          </span>
        )}
        {task.dueDate && (
          <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-400' : ''}`}>
            <Calendar className="w-3 h-3" />
            {new Date(task.dueDate).toLocaleDateString('pt-BR')}
          </span>
        )}
        {isOverdue && (
          <span className="flex items-center gap-1 text-red-400">
            <AlertTriangle className="w-3 h-3" />
            Atrasada
          </span>
        )}
      </div>
    </div>
  )
}

export default function TaskClientView({
  openTasks,
  completedTasks,
  overdueTasks,
  statusLabels,
  priorityColors,
  priorityLabels,
}: any) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-base font-semibold text-zinc-100 tracking-tight">Minhas Tarefas</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Tarefas atribuídas a você</p>
      </div>

      {overdueTasks.length > 0 && (
        <div className="mb-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h2 className="text-sm font-medium text-red-400">Tarefas Atrasadas ({overdueTasks.length})</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {overdueTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                statusLabels={statusLabels}
                priorityColors={priorityColors}
                priorityLabels={priorityLabels}
                isOverdue={true}
                onClick={setSelectedTaskId}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mb-6 animate-fade-in-delay">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-zinc-500" />
          <h2 className="text-sm font-medium text-zinc-300">Tarefas em Aberto ({openTasks.length})</h2>
        </div>
        {openTasks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {openTasks.map(task => {
              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date()
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  statusLabels={statusLabels}
                  priorityColors={priorityColors}
                  priorityLabels={priorityLabels}
                  isOverdue={isOverdue}
                  onClick={setSelectedTaskId}
                />
              )
            })}
          </div>
        ) : (
          <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">Nenhuma tarefa em aberto</p>
          </div>
        )}
      </div>

      <div className="animate-fade-in-delay-2">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <h2 className="text-sm font-medium text-zinc-300">Últimas Concluídas ({completedTasks.length})</h2>
        </div>
        {completedTasks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {completedTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                statusLabels={statusLabels}
                priorityColors={priorityColors}
                priorityLabels={priorityLabels}
                isOverdue={false}
                onClick={setSelectedTaskId}
              />
            ))}
          </div>
        ) : (
          <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-8 text-center">
            <p className="text-sm text-zinc-500">Nenhuma tarefa concluída ainda</p>
          </div>
        )}
      </div>

      {selectedTaskId && (
        <TaskDetailModal
          open={!!selectedTaskId}
          onOpenChange={(open) => { if (!open) setSelectedTaskId(null) }}
          taskId={selectedTaskId}
          initialTask={null}
        />
      )}
    </div>
  )
}
