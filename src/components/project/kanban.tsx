'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, GripVertical, Clock, User, Paperclip, X, Loader2, Calendar, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import TaskDetailModal from '@/components/task/detail-modal'

// --- Types ---

type PipelineStage = {
  id: string
  name: string
  order: number
  color: string
}

type Task = {
  id: string
  title: string
  description: string | null
  status: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  pipelineStageId: string | null
  assignedTo: { id: string; name: string } | null
  _timeEntries?: { minutes: number }[]
  dueDate?: string | null
}

type User = {
  id: string
  name: string
}

type TemplateType = 'AGILE' | 'WATERFALL' | 'SIMPLE'

type TemplateOption = {
  key: TemplateType
  label: string
  stages: string[]
  description: string
  icon: string
}

// --- Constants ---

const templateOptions: TemplateOption[] = [
  {
    key: 'AGILE',
    label: 'Agil',
    stages: ['Backlog', 'A Fazer', 'Em Progresso', 'Em Revisao', 'Concluido'],
    description: 'Ideal para times que trabalham com sprints e iteracoes',
    icon: '🔄',
  },
  {
    key: 'WATERFALL',
    label: 'Waterfall',
    stages: ['Planejamento', 'Execucao', 'Teste', 'Implantacao', 'Concluido'],
    description: 'Para projetos com fases sequenciais bem definidas',
    icon: '📐',
  },
  {
    key: 'SIMPLE',
    label: 'Simples',
    stages: ['A Fazer', 'Fazendo', 'Concluido'],
    description: 'Quadro minimalista para projetos pequenos',
    icon: '✨',
  },
]

const priorityColors: Record<string, string> = {
  LOW: 'bg-zinc-800 text-zinc-400 border-zinc-700/40',
  MEDIUM: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  URGENT: 'bg-red-500/10 text-red-400 border-red-500/20',
}

const priorityLabels: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente',
}

const statusFromStageOrder = (order: number, totalStages: number): string => {
  if (totalStages <= 1) return 'TODO'
  const ratio = order / (totalStages - 1)
  if (ratio <= 0) return 'TODO'
  if (ratio <= 0.33) return 'IN_PROGRESS'
  if (ratio <= 0.66) return 'IN_REVIEW'
  return 'DONE'
}

// --- Component ---

export default function KanbanBoard({
  projectId,
  tasks: initialTasks,
  stages: initialStages,
  canEdit,
  members = [],
  completionStageId,
  allowPublicTasks,
  taskTypes = [],
  defaultTaskTypeId,
}: {
  projectId: string
  tasks: Task[]
  stages: PipelineStage[]
  canEdit: boolean
  members?: User[]
  completionStageId?: string | null
  allowPublicTasks?: boolean
  taskTypes?: { id: string; name: string; slaMinutes: number }[]
  defaultTaskTypeId?: string | null
}) {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [stages, setStages] = useState<PipelineStage[]>(initialStages)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false)
  const [showTaskDetail, setShowTaskDetail] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | null>(null)
  const [targetStageId, setTargetStageId] = useState<string | null>(null)
  const [creatingPipeline, setCreatingPipeline] = useState(false)
  const [creatingTask, setCreatingTask] = useState(false)

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM')
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>('')
  const [newTaskTypeId, setNewTaskTypeId] = useState(defaultTaskTypeId || '')
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setAttachedFile(file)
  }

  const removeFile = () => {
    setAttachedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Group tasks by stage
  const getTasksForStage = useCallback(
    (stage: PipelineStage) => {
      const stageTasks = tasks.filter((t) => t.pipelineStageId === stage.id)
      return stageTasks
    },
    [tasks],
  )

  // Tasks without stage go to first stage (order 0)
  const getFirstStageTasks = useCallback(() => {
    const firstStage = stages.find((s) => s.order === 0)
    if (!firstStage) return []
    return tasks.filter(
      (t) => t.pipelineStageId === firstStage.id || t.pipelineStageId === null,
    )
  }, [tasks, stages])

  // Handle drop on a column
  const handleDrop = useCallback(
    async (stageId: string) => {
      if (!draggedTaskId || !canEdit) return

      const task = tasks.find((t) => t.id === draggedTaskId)
      if (!task || task.pipelineStageId === stageId) {
        setDraggedTaskId(null)
        setDragOverColumn(null)
        return
      }

      const targetStage = stages.find((s) => s.id === stageId)
      const status = targetStage
        ? statusFromStageOrder(targetStage.order, stages.length)
        : task.status

      try {
        const res = await fetch(`/api/tasks/${draggedTaskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pipelineStageId: stageId,
            status,
          }),
        })

        if (res.ok) {
          const updatedTask = await res.json()
          setTasks((prev) =>
            prev.map((t) => (t.id === draggedTaskId ? { ...t, ...updatedTask } : t)),
          )
        }
      } catch (error) {
        console.error('Failed to move task:', error)
      } finally {
        setDraggedTaskId(null)
        setDragOverColumn(null)
      }
    },
    [draggedTaskId, tasks, stages, canEdit],
  )

  // Drag handlers
  const handleDragStart = (taskId: string) => {
    if (!canEdit) return
    setDraggedTaskId(taskId)
  }

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    if (!canEdit) return
    e.preventDefault()
    setDragOverColumn(stageId)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDragEnd = () => {
    setDraggedTaskId(null)
    setDragOverColumn(null)
  }

  // Create pipeline with template
  const handleCreatePipeline = async (template: TemplateType) => {
    setCreatingPipeline(true)
    try {
      const res = await fetch('/api/pipelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          template,
        }),
      })

      if (res.ok) {
        const pipeline = await res.json()
        setStages(pipeline.stages)
        setShowTemplateDialog(false)
        setSelectedTemplate(null)
      }
    } catch (error) {
      console.error('Failed to create pipeline:', error)
    } finally {
      setCreatingPipeline(false)
    }
  }

  // Create task
  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return

    // Block creation on completion stage
    if (targetStageId === completionStageId) {
      alert('Não é possível criar tarefas diretamente na etapa de conclusão.')
      return
    }

    setCreatingTask(true)
    try {
      let attachmentUrl: string | null = null
      if (attachedFile) {
        setUploadingFile(true)
        const formData = new FormData()
        formData.append('file', attachedFile)
        formData.append('projectId', projectId)

        const uploadRes = await fetch('/api/storage/upload', { method: 'POST', body: formData })
        if (uploadRes.ok) {
          const data = await uploadRes.json()
          attachmentUrl = data.publicUrl
        }
        setUploadingFile(false)
      }

      const status = targetStageId
        ? statusFromStageOrder(
            stages.find((s) => s.id === targetStageId)?.order ?? 0,
            stages.length,
          )
        : 'TODO'

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim() || null,
          projectId,
          pipelineStageId: targetStageId,
          status,
          priority: newTaskPriority,
          assignedToId: newTaskAssignee || null,
          taskTypeId: newTaskTypeId || null,
          attachmentUrl,
          attachmentName: attachedFile?.name || null,
        }),
      })

      if (res.ok) {
        const task = await res.json()
        setTasks((prev) => [...prev, task])
        setShowAddTaskDialog(false)
        setNewTaskTitle('')
        setNewTaskDescription('')
        setNewTaskPriority('MEDIUM')
        setNewTaskAssignee('')
        setNewTaskTypeId(defaultTaskTypeId || '')
        setTargetStageId(null)
        setAttachedFile(null)
      }
    } catch (error) {
      console.error('Failed to create task:', error)
    } finally {
      setCreatingTask(false)
      setUploadingFile(false)
    }
  }

  // Open add task dialog for a specific stage
  const openAddTask = (stageId: string) => {
    if (!canEdit) return
    if (stageId === completionStageId) {
      alert('Não é possível criar tarefas diretamente na etapa de conclusão.')
      return
    }
    setTargetStageId(stageId)
    setShowAddTaskDialog(true)
  }

  // Open task detail modal
  const openTaskDetail = (taskId: string) => {
    setSelectedTaskId(taskId)
    setShowTaskDetail(true)
  }

  // Handle task update - refresh tasks list
  const handleTaskUpdate = () => {
    router.refresh()
  }

  // Calculate total minutes for a task
  const getTaskTimeLogged = (task: Task) => {
    if (!task._timeEntries || task._timeEntries.length === 0) return 0
    return task._timeEntries.reduce((sum, entry) => sum + entry.minutes, 0)
  }

  const formatTime = (minutes: number) => {
    if (minutes === 0) return null
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) return `${hours}h ${mins > 0 ? `${mins}m` : ''}`
    return `${mins}m`
  }

  // --- Render: No stages - show template picker ---
  if (stages.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[400px] py-16">
          <div className="text-center mb-8">
            <h3 className="text-lg font-medium text-zinc-200 mb-2">
              Configure seu quadro Kanban
            </h3>
            <p className="text-sm text-zinc-500 max-w-md">
              Escolha um modelo de pipeline para organizar as tarefas do projeto
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full px-4">
            {templateOptions.map((template) => (
              <button
                key={template.key}
                disabled={creatingPipeline}
                onClick={() => handleCreatePipeline(template.key)}
                className="group flex flex-col items-start bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-5 hover:border-zinc-700/60 hover:bg-zinc-900/40 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="text-2xl mb-3">{template.icon}</div>
                <h4 className="text-sm font-medium text-zinc-200 group-hover:text-zinc-100 transition-colors mb-1">
                  {template.label}
                </h4>
                <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                  {template.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-auto">
                  {template.stages.map((stage, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800/60 text-zinc-400 border border-zinc-700/30"
                    >
                      {stage}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>

          {creatingPipeline && (
            <p className="text-xs text-zinc-500 mt-6">Criando pipeline...</p>
          )}
        </div>

        {/* Add Task Dialog */}
        <Dialog open={showAddTaskDialog} onOpenChange={setShowAddTaskDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Tarefa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="task-title">Titulo</Label>
                <Input
                  id="task-title"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Nome da tarefa"
                  className="mt-1.5"
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="task-priority">Prioridade</Label>
                <Select
                  value={newTaskPriority}
                  onValueChange={(v) =>
                    setNewTaskPriority(v as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Baixa</SelectItem>
                    <SelectItem value="MEDIUM">Media</SelectItem>
                    <SelectItem value="HIGH">Alta</SelectItem>
                    <SelectItem value="URGENT">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {taskTypes.length > 0 && (
                <div>
                  <Label htmlFor="task-type">Tipo de Tarefa</Label>
                  <Select
                    value={newTaskTypeId}
                    onValueChange={setNewTaskTypeId}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {taskTypes.map((tt) => (
                        <SelectItem key={tt.id} value={tt.id}>
                          {tt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {members.length > 0 && (
                <div>
                  <Label htmlFor="task-assignee">Responsavel</Label>
                  <Select
                    value={newTaskAssignee}
                    onValueChange={setNewTaskAssignee}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAddTaskDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateTask}
                disabled={!newTaskTitle.trim() || creatingTask}
              >
                {creatingTask ? 'Criando...' : 'Criar Tarefa'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // --- Render: Kanban board ---
  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-4 min-h-[500px] snap-x snap-mandatory md:snap-none">
        {stages
          .sort((a, b) => a.order - b.order)
          .map((stage) => {
            const stageTasks =
              stage.order === 0 ? getFirstStageTasks() : getTasksForStage(stage)

            return (
              <div
                key={stage.id}
                className={`flex-shrink-0 w-[280px] md:w-72 flex flex-col bg-zinc-950/50 border rounded-lg transition-colors snap-center ${
                  dragOverColumn === stage.id && canEdit
                    ? 'border-zinc-600/80 bg-zinc-900/30'
                    : 'border-zinc-800/60'
                }`}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => {
                  e.preventDefault()
                  handleDrop(stage.id)
                }}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-800/40">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <h3 className="text-xs font-medium text-zinc-400">
                      {stage.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-zinc-600 tabular-nums">
                      {stageTasks.length}
                    </span>
                    {canEdit && (
                      <button
                        onClick={() => openAddTask(stage.id)}
                        className="text-zinc-600 hover:text-zinc-300 transition-colors p-0.5 rounded hover:bg-zinc-800/40"
                        title="Adicionar tarefa"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Tasks */}
                <div className="flex-1 p-2 space-y-2 min-h-[80px] overflow-y-auto">
                  {stageTasks.map((task) => {
                    const timeLogged = getTaskTimeLogged(task)
                    const isDragging = draggedTaskId === task.id
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE' && task.status !== 'CANCELLED'

                    return (
                      <div
                        key={task.id}
                        draggable={canEdit}
                        onDragStart={() => handleDragStart(task.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => openTaskDetail(task.id)}
                        className={`group cursor-pointer bg-zinc-900/60 border rounded-md p-2.5 md:p-3 transition-all ${
                          isDragging
                            ? 'opacity-50 scale-95'
                            : 'hover:border-zinc-700/60'
                        } ${isOverdue ? 'border-red-500/40 hover:border-red-500/60' : 'border-zinc-800/40'} ${canEdit ? 'cursor-grab active:cursor-grabbing' : ''}`}
                      >
                        {/* Title */}
                        <p className="text-[11px] md:text-xs text-zinc-300 group-hover:text-zinc-100 transition-colors line-clamp-2 mb-1.5 md:mb-2 leading-relaxed">
                          {task.title}
                        </p>

                        {/* Meta row */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            {/* Priority badge */}
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 border ${priorityColors[task.priority]}`}
                            >
                              {priorityLabels[task.priority]}
                            </Badge>

                            {/* Due date */}
                            {task.dueDate && (
                              <span className={`flex items-center gap-0.5 text-[10px] ${isOverdue ? 'text-red-400' : 'text-zinc-600'}`}>
                                <Calendar className="w-2.5 h-2.5" />
                                {new Date(task.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                              </span>
                            )}

                            {/* Time logged */}
                            {timeLogged > 0 && (
                              <span className="flex items-center gap-0.5 text-[10px] text-zinc-600">
                                <Clock className="w-2.5 h-2.5" />
                                {formatTime(timeLogged)}
                              </span>
                            )}
                          </div>

                          {/* Assignee */}
                          {task.assignedTo && (
                            <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                              <User className="w-2.5 h-2.5" />
                              {task.assignedTo.name.split(' ')[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {stageTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <p className="text-[11px] text-zinc-700">Vazio</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
      </div>

      {/* Add Task Dialog */}
      <Dialog open={showAddTaskDialog} onOpenChange={setShowAddTaskDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Tarefa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="task-title">Titulo</Label>
              <Input
                id="task-title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Nome da tarefa"
                className="mt-1.5"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="task-desc">Descrição</Label>
              <textarea
                id="task-desc"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder="Detalhes da tarefa (opcional)"
                className="mt-1.5 w-full bg-zinc-900/60 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 resize-none min-h-[60px]"
              />
            </div>
            <div>
              <Label htmlFor="task-priority">Prioridade</Label>
              <Select
                value={newTaskPriority}
                onValueChange={(v) =>
                  setNewTaskPriority(v as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')
                }
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Baixa</SelectItem>
                  <SelectItem value="MEDIUM">Média</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {taskTypes.length > 0 && (
              <div>
                <Label htmlFor="task-type">Tipo de Tarefa</Label>
                <Select
                  value={newTaskTypeId}
                  onValueChange={setNewTaskTypeId}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskTypes.map((tt) => (
                      <SelectItem key={tt.id} value={tt.id}>
                        {tt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {members.length > 0 && (
              <div>
                <Label htmlFor="task-assignee">Responsável</Label>
                <Select
                  value={newTaskAssignee}
                  onValueChange={setNewTaskAssignee}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Attachment */}
          <div className="border-t border-zinc-800/40 pt-4">
            <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" />
            {attachedFile ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/40 rounded-md">
                <Paperclip className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs text-zinc-300 truncate flex-1">{attachedFile.name}</span>
                <button type="button" onClick={removeFile} className="text-zinc-600 hover:text-zinc-300"><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 border border-dashed border-zinc-700 rounded-md py-2 text-xs text-zinc-500 hover:border-zinc-600 hover:text-zinc-400 transition-colors">
                <Paperclip className="w-3.5 h-3.5" />
                Anexar arquivo (opcional)
              </button>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddTaskDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateTask}
              disabled={!newTaskTitle.trim() || creatingTask || uploadingFile}
            >
              {uploadingFile ? 'Enviando anexo...' : creatingTask ? 'Criando...' : 'Criar Tarefa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Detail Modal */}
      <TaskDetailModal
        open={showTaskDetail}
        onOpenChange={setShowTaskDetail}
        taskId={selectedTaskId}
        initialTask={null}
        onUpdate={handleTaskUpdate}
        taskIds={tasks.map(t => t.id)}
        stages={stages}
      />
    </>
  )
}
