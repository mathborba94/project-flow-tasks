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
  assignedToId: string | null
  assignedTo: { id: string; name: string } | null
  _timeEntries?: { minutes: number }[]
  _timeEntriesCount?: number
  dueDate?: string | null
  createdAt?: string
  stageEnteredAt?: string
  todayMinutes?: number
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
  LOW: 'dark:bg-zinc-800 bg-zinc-100 text-zinc-400 dark:border-zinc-700/40 border-zinc-200',
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
  userRole,
  userId,
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
  userRole?: string
  userId?: string
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

  // Task refresh - refetch tasks from API
  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks?projectId=${projectId}`)
      if (res.ok) {
        const data = await res.json()
        // Serialize to match kanban expected format
        const serialized = data.map((t: any) => ({
          ...t,
          createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
          dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
          _timeEntries: [],
          _timeEntriesCount: t._count?.timeEntries || 0,
          stageEnteredAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
          todayMinutes: 0,
        }))
        setTasks(serialized)
      }
    } catch (e) {
      console.error('Failed to refresh tasks:', e)
    }
  }, [projectId])

  const handleTaskUpdate = useCallback(() => {
    router.refresh()
    fetchTasks()
  }, [router, fetchTasks])

  // Filters, search, pagination, list view
  const [searchTerm, setSearchTerm] = useState('')
  const [showMyTasks, setShowMyTasks] = useState(false)
  const [listView, setListView] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('kanban-list-view') === 'true'
    }
    return false
  })
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({})
  const PAGE_SIZE = 30
  const [stagePages, setStagePages] = useState<Record<string, number>>({})

  // Save list view preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kanban-list-view', String(listView))
    }
  }, [listView])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setAttachedFile(file)
  }

  const removeFile = () => {
    setAttachedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Group tasks by stage WITH filters
  const getFilteredTasks = useCallback(
    (taskList: Task[]) => {
      let filtered = taskList

      // Filter: my tasks only
      if (showMyTasks && userId) {
        filtered = filtered.filter(t => t.assignedToId === userId || (t.assignedTo && t.assignedTo.id === userId))
      }

      // Search: id, title, description
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim()
        filtered = filtered.filter(t =>
          t.id.toLowerCase().includes(term) ||
          t.title.toLowerCase().includes(term) ||
          (t.description && t.description.toLowerCase().includes(term))
        )
      }

      return filtered
    },
    [showMyTasks, userId, searchTerm],
  )

  const getTasksForStage = useCallback(
    (stage: PipelineStage) => {
      const stageTasks = tasks.filter((t) => t.pipelineStageId === stage.id)
      return getFilteredTasks(stageTasks)
    },
    [tasks, getFilteredTasks],
  )

  // Tasks without stage go to first stage (order 0)
  const getFirstStageTasks = useCallback(() => {
    const firstStage = stages.find((s) => s.order === 0)
    if (!firstStage) return []
    const stageTasks = tasks.filter(
      (t) => t.pipelineStageId === firstStage.id || t.pipelineStageId === null,
    )
    return getFilteredTasks(stageTasks)
  }, [tasks, stages, getFilteredTasks])

  // Paginated tasks for a stage
  const getPaginatedTasks = useCallback(
    (stageTasks: Task[], stageId: string) => {
      const page = stagePages[stageId] || 0
      const start = page * PAGE_SIZE
      const end = start + PAGE_SIZE
      const paged = stageTasks.slice(start, end)
      const totalPages = Math.ceil(stageTasks.length / PAGE_SIZE)
      return { paged, totalPages, currentPage: page, total: stageTasks.length }
    },
    [stagePages],
  )

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

  // Calculate total minutes for a task
  const getTaskTimeLogged = (task: Task) => {
    if (!task._timeEntries || task._timeEntries.length === 0) return 0
    return task._timeEntries.reduce((sum, entry) => sum + entry.minutes, 0)
  }

  const formatTime = (minutes: number) => {
    if (minutes === 0) return null
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) return `${hours}h${mins > 0 ? `${mins}m` : ''}`
    return `${mins}m`
  }

  const getDaysInStage = (task: Task): number => {
    const since = task.stageEnteredAt ? new Date(task.stageEnteredAt) : (task.createdAt ? new Date(task.createdAt) : new Date())
    return Math.max(0, Math.floor((Date.now() - since.getTime()) / 86400000))
  }

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  // --- Render: No stages - show template picker ---
  if (stages.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[400px] py-16">
          <div className="text-center mb-8">
            <h3 className="text-lg font-medium dark:text-zinc-200 text-zinc-800 mb-2">
              Configure seu quadro Kanban
            </h3>
            <p className="text-sm dark:text-zinc-500 text-zinc-500 max-w-md">
              Escolha um modelo de pipeline para organizar as tarefas do projeto
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full px-4">
            {templateOptions.map((template) => (
              <button
                key={template.key}
                disabled={creatingPipeline}
                onClick={() => handleCreatePipeline(template.key)}
                className="group flex flex-col items-start dark:bg-zinc-950/50 bg-white border dark:border-zinc-800/60 border-zinc-200 rounded-lg p-5 dark:hover:border-zinc-700/60 border-zinc-200 dark:hover:bg-zinc-900/40 bg-zinc-100 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="text-2xl mb-3">{template.icon}</div>
                <h4 className="text-sm font-medium dark:text-zinc-200 text-zinc-800 group-dark:hover:text-zinc-100 text-zinc-900 transition-colors mb-1">
                  {template.label}
                </h4>
                <p className="text-xs dark:text-zinc-500 text-zinc-500 mb-4 leading-relaxed">
                  {template.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-auto">
                  {template.stages.map((stage, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-full dark:bg-zinc-800/60 bg-zinc-100 dark:text-zinc-400 text-zinc-400 border border-zinc-700/30"
                    >
                      {stage}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>

          {creatingPipeline && (
            <p className="text-xs dark:text-zinc-500 text-zinc-500 mt-6">Criando pipeline...</p>
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
                  <Label htmlFor="task-type">Tipo / SLA</Label>
                  <Select
                    value={newTaskTypeId}
                    onValueChange={setNewTaskTypeId}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {taskTypes.map((tt) => (
                        <SelectItem key={tt.id} value={tt.id}>
                          {tt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(() => {
                    const tt = taskTypes.find(t => t.id === newTaskTypeId)
                    if (!tt) return null
                    const due = new Date(Date.now() + tt.slaMinutes * 60 * 1000)
                    const fmt = due.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    const hours = Math.floor(tt.slaMinutes / 60)
                    const mins = tt.slaMinutes % 60
                    const slaFmt = hours > 0 ? `${hours}h${mins > 0 ? `${mins}m` : ''}` : `${mins}m`
                    return (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-400/90 bg-amber-500/8 border border-amber-500/15 rounded-md px-3 py-2">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        <span>Prazo SLA: <strong>{fmt}</strong> <span className="text-amber-500/70">({slaFmt})</span></span>
                      </div>
                    )
                  })()}
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

  // Toolbar: search, my tasks filter, list view toggle
  const FilterBar = () => (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setStagePages({}); }}
          placeholder="Buscar por ID, título ou descrição..."
          className="w-full dark:bg-zinc-900/60 bg-zinc-50 border dark:border-zinc-800 border-zinc-300 rounded-md pl-8 pr-3 py-1.5 text-xs dark:text-zinc-200 text-zinc-800 placeholder:dark:text-zinc-600 text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-700"
        />
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 dark:text-zinc-600 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* My tasks toggle */}
      {userId && (
        <button
          onClick={() => { setShowMyTasks(!showMyTasks); setStagePages({}); }}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            showMyTasks
              ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
              : 'dark:bg-zinc-900/60 bg-zinc-50 dark:text-zinc-500 text-zinc-500 border dark:border-zinc-800 border-zinc-300 dark:hover:text-zinc-300 dark:text-zinc-600 text-zinc-400'
          }`}
        >
          <User className="w-3 h-3" />
          Minhas tarefas
        </button>
      )}

      {/* List view toggle */}
      <button
        onClick={() => setListView(!listView)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
          listView
            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
            : 'dark:bg-zinc-900/60 bg-zinc-50 dark:text-zinc-500 text-zinc-500 border dark:border-zinc-800 border-zinc-300 dark:hover:text-zinc-300 dark:text-zinc-600 text-zinc-400'
        }`}
        title={listView ? 'Voltar para Kanban' : 'Ver como lista'}
      >
        {listView ? (
          <>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 6h16M4 12h16M4 12h16M4 18h16M4 18h16" />
            </svg>
            Kanban
          </>
        ) : (
          <>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Lista
          </>
        )}
      </button>
    </div>
  )

  return (
    <>
      <FilterBar />

      {/* List View */}
      {listView ? (
        <div className="space-y-2">
          {stages
            .sort((a, b) => a.order - b.order)
            .map((stage) => {
              const stageTasks = stage.order === 0 ? getFirstStageTasks() : getTasksForStage(stage)
              const { paged, totalPages, currentPage, total } = getPaginatedTasks(stageTasks, stage.id)
              const isExpanded = expandedStages[stage.id] !== false

              return (
                <div key={stage.id} className="dark:bg-zinc-950/50 bg-white border dark:border-zinc-800/60 border-zinc-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedStages(prev => ({ ...prev, [stage.id]: !prev[stage.id] }))}
                    className="w-full flex items-center justify-between px-4 py-3 dark:hover:bg-zinc-900/40 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                      <h3 className="text-xs font-medium dark:text-zinc-400 text-zinc-600">{stage.name}</h3>
                      <span className="text-[11px] dark:text-zinc-600 text-zinc-400 tabular-nums">{total}</span>
                    </div>
                    <svg className={`w-4 h-4 dark:text-zinc-600 text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div>
                      {paged.length === 0 ? (
                        <p className="text-xs dark:text-zinc-600 text-zinc-400 text-center py-4">Nenhuma tarefa</p>
                      ) : (
                        <div className="divide-y dark:divide-zinc-800/40 divide-zinc-200/50">
                          {paged.map((task) => {
                            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE' && task.status !== 'CANCELLED'
                            const initials = task.assignedTo ? getInitials(task.assignedTo.name) : null

                            return (
                              <div
                                key={task.id}
                                onClick={() => openTaskDetail(task.id)}
                                className={`flex items-center gap-3 px-4 py-2 cursor-pointer dark:hover:bg-zinc-900/40 hover:bg-zinc-50 transition-colors min-w-0 ${isOverdue ? 'border-l-2 border-l-red-500' : ''}`}
                              >
                                {/* ID */}
                                <span className="text-[10px] dark:text-zinc-600 text-zinc-400 font-mono flex-shrink-0 w-[60px] truncate" title={task.id}>
                                  {task.id.slice(-6)}
                                </span>

                                {/* Priority dot */}
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  task.priority === 'URGENT' ? 'bg-red-500' :
                                  task.priority === 'HIGH' ? 'bg-orange-500' :
                                  task.priority === 'MEDIUM' ? 'bg-blue-500' :
                                  'dark:bg-zinc-700 bg-zinc-300'
                                }`} />

                                {/* Title */}
                                <span className="text-xs dark:text-zinc-300 text-zinc-700 flex-1 min-w-0 truncate" title={task.title}>
                                  {task.title.length > 120 ? task.title.slice(0, 120) + '…' : task.title}
                                </span>

                                {/* Assignee */}
                                {task.assignedTo ? (
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
                                      <span className="text-[7px] font-bold text-white">{initials}</span>
                                    </div>
                                    <span className="text-[10px] dark:text-zinc-500 text-zinc-500">{task.assignedTo.name.split(' ')[0]}</span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] dark:text-zinc-600 text-zinc-400 flex-shrink-0">Sem responsável</span>
                                )}

                                {/* Due date */}
                                {task.dueDate && (
                                  <span className={`text-[10px] flex-shrink-0 ${isOverdue ? 'text-red-400' : 'dark:text-zinc-600 text-zinc-400'}`}>
                                    {new Date(task.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-2 border-t dark:border-zinc-800/40 border-zinc-200">
                          <span className="text-[10px] dark:text-zinc-600 text-zinc-400">
                            Página {currentPage + 1} de {totalPages}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setStagePages(prev => ({ ...prev, [stage.id]: Math.max(0, (prev[stage.id] || 0) - 1) }))}
                              disabled={currentPage === 0}
                              className="px-2 py-1 text-xs rounded dark:bg-zinc-900/60 bg-zinc-50 dark:text-zinc-500 text-zinc-500 dark:hover:text-zinc-300 dark:text-zinc-600 text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              ← Anterior
                            </button>
                            <button
                              onClick={() => setStagePages(prev => ({ ...prev, [stage.id]: Math.min(totalPages - 1, (prev[stage.id] || 0) + 1) }))}
                              disabled={currentPage >= totalPages - 1}
                              className="px-2 py-1 text-xs rounded dark:bg-zinc-900/60 bg-zinc-50 dark:text-zinc-500 text-zinc-500 dark:hover:text-zinc-300 dark:text-zinc-600 text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              Próxima →
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      ) : (
        /* Kanban Board View */
        <div className="flex gap-3 overflow-x-auto pb-4 min-h-[500px] snap-x snap-mandatory md:snap-none">
        {stages
          .sort((a, b) => a.order - b.order)
          .map((stage) => {
            const stageTasks =
              stage.order === 0 ? getFirstStageTasks() : getTasksForStage(stage)
            const { paged, totalPages, currentPage, total } = getPaginatedTasks(stageTasks, stage.id)

            return (
              <div
                key={stage.id}
                className={`flex-shrink-0 w-[280px] md:w-72 flex flex-col dark:bg-zinc-950/50 bg-white border rounded-lg transition-colors snap-center ${
                  dragOverColumn === stage.id && canEdit
                    ? 'border-zinc-600/80 dark:bg-zinc-900/30 bg-zinc-200/50'
                    : 'dark:border-zinc-800/60 border-zinc-200'
                }`}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => {
                  e.preventDefault()
                  handleDrop(stage.id)
                }}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-3 py-2.5 border-b dark:border-zinc-800/40 border-zinc-200">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <h3 className="text-xs font-medium dark:text-zinc-400 text-zinc-600">
                      {stage.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] dark:text-zinc-600 text-zinc-400 tabular-nums">
                      {total}
                    </span>
                    {canEdit && (
                      <button
                        onClick={() => openAddTask(stage.id)}
                        className="dark:text-zinc-600 text-zinc-400 dark:hover:text-zinc-300 dark:text-zinc-600 text-zinc-400 transition-colors p-0.5 rounded dark:hover:bg-zinc-800/40 bg-zinc-100"
                        title="Adicionar tarefa"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Tasks */}
                <div className="flex-1 p-2 space-y-2 min-h-[80px] overflow-y-auto">
                  {paged.map((task) => {
                    const timeLogged = getTaskTimeLogged(task)
                    const isDragging = draggedTaskId === task.id
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE' && task.status !== 'CANCELLED'
                    const daysInStage = getDaysInStage(task)
                    const todayFmt = formatTime(task.todayMinutes || 0)
                    const totalFmt = formatTime(timeLogged || (task._timeEntriesCount ? task._timeEntriesCount * 30 : 0))
                    const snippet = task.description
                      ? task.description.length > 100
                        ? task.description.slice(0, 97) + '…'
                        : task.description
                      : null
                    const initials = task.assignedTo ? getInitials(task.assignedTo.name) : null

                    return (
                      <div
                        key={task.id}
                        draggable={canEdit}
                        onDragStart={() => handleDragStart(task.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => openTaskDetail(task.id)}
                        className={`group relative cursor-pointer rounded-lg transition-all duration-150 ${
                          isDragging ? 'opacity-40 scale-95' : ''
                        } ${canEdit ? 'cursor-grab active:cursor-grabbing' : ''}`}
                      >
                        {/* Priority accent bar on left */}
                        <div className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-full ${
                          task.priority === 'URGENT' ? 'bg-red-500' :
                          task.priority === 'HIGH' ? 'bg-orange-500' :
                          task.priority === 'MEDIUM' ? 'bg-blue-500' :
                          'dark:bg-zinc-700 bg-zinc-300'
                        }`} />

                        <div className={`ml-2 dark:bg-zinc-900/70 bg-zinc-100 border rounded-lg overflow-hidden transition-all ${
                          isOverdue
                            ? 'border-red-500/30 hover:border-red-500/50 shadow-[0_0_0_1px_rgba(239,68,68,0.08)]'
                            : 'dark:border-zinc-800/50 border-zinc-200 dark:hover:border-zinc-700/60 hover:border-zinc-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                        }`}>

                          {/* Top section */}
                          <div className="px-3 pt-3 pb-2">
                            {/* Priority + overdue row */}
                            <div className="flex items-center gap-1.5 mb-2">
                              <span className={`text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded border ${priorityColors[task.priority]}`}>
                                {priorityLabels[task.priority]}
                              </span>
                              {isOverdue && (
                                <span className="flex items-center gap-0.5 text-[9px] text-red-400 font-medium">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  Atrasada
                                </span>
                              )}
                              {task.dueDate && !isOverdue && (
                                <span className="flex items-center gap-0.5 text-[9px] dark:text-zinc-600 text-zinc-400 ml-auto">
                                  <Calendar className="w-2.5 h-2.5" />
                                  {new Date(task.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                </span>
                              )}
                            </div>

                            {/* Title */}
                            <p className="text-[11px] md:text-xs font-medium dark:text-zinc-200 text-zinc-800 group-dark:hover:text-zinc-100 text-zinc-900 transition-colors line-clamp-2 leading-snug mb-1">
                              {task.title}
                            </p>
                            {/* Task ID */}
                            <p className="text-[9px] dark:text-zinc-600 text-zinc-400 font-mono">{task.id.slice(-6)}</p>

                            {/* Description snippet */}
                            {snippet && (
                              <p className="text-[10px] dark:text-zinc-500 text-zinc-500 italic leading-relaxed line-clamp-2">
                                {snippet}
                              </p>
                            )}
                          </div>

                          {/* Divider */}
                          <div className="mx-3 border-t dark:border-zinc-800/60 border-zinc-200" />

                          {/* Bottom section */}
                          <div className="px-3 py-2 space-y-1.5">
                            {/* Assignee + Created */}
                            <div className="flex items-center justify-between gap-2">
                              {task.assignedTo ? (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                                    <span className="text-[7px] font-bold text-white leading-none">{initials}</span>
                                  </div>
                                  <span className="text-[10px] dark:text-zinc-400 text-zinc-400 truncate max-w-[90px]">
                                    {task.assignedTo.name.split(' ')[0]}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <div className="w-4 h-4 rounded-full border border-dashed dark:border-zinc-700 border-zinc-300 flex items-center justify-center">
                                    <User className="w-2 h-2 dark:text-zinc-600 text-zinc-400" />
                                  </div>
                                  <span className="text-[10px] dark:text-zinc-600 text-zinc-400">Sem responsável</span>
                                </div>
                              )}
                              {task.createdAt && (
                                <span className="text-[9px] dark:text-zinc-600 text-zinc-400 tabular-nums flex-shrink-0">
                                  {new Date(task.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                </span>
                              )}
                            </div>

                            {/* Metrics row */}
                            <div className="flex items-center gap-2">
                              {/* Days in stage */}
                              <div className={`flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded ${
                                daysInStage >= 7 ? 'bg-amber-500/10 text-amber-400' :
                                daysInStage >= 3 ? 'bg-blue-500/10 text-blue-400' :
                                'dark:bg-zinc-800/60 bg-zinc-100 dark:text-zinc-600 text-zinc-400'
                              }`}>
                                <Clock className="w-2 h-2" />
                                {daysInStage}d no pipe
                              </div>

                              {/* Hours today */}
                              {todayFmt && (
                                <div className="flex items-center gap-1 text-[9px] font-medium bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">
                                  <Clock className="w-2 h-2" />
                                  {todayFmt} hoje
                                </div>
                              )}

                              {/* Total time logged */}
                              {(task._timeEntriesCount || 0) > 0 && !todayFmt && (
                                <div className="flex items-center gap-1 text-[9px] dark:text-zinc-600 text-zinc-400 ml-auto">
                                  <Clock className="w-2 h-2" />
                                  {task._timeEntriesCount}h reg.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {paged.length === 0 && total === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <p className="text-[11px] dark:text-zinc-600 text-zinc-400">Vazio</p>
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1 px-2 py-2 border-t dark:border-zinc-800/40 border-zinc-200">
                      <button
                        onClick={() => setStagePages(prev => ({ ...prev, [stage.id]: Math.max(0, (prev[stage.id] || 0) - 1) }))}
                        disabled={currentPage === 0}
                        className="px-1.5 py-0.5 text-[10px] rounded dark:bg-zinc-900/60 bg-zinc-50 dark:text-zinc-500 text-zinc-500 dark:hover:text-zinc-300 dark:text-zinc-600 text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        ←
                      </button>
                      <span className="text-[10px] dark:text-zinc-600 text-zinc-400 tabular-nums">
                        {currentPage + 1}/{totalPages}
                      </span>
                      <button
                        onClick={() => setStagePages(prev => ({ ...prev, [stage.id]: Math.min(totalPages - 1, (prev[stage.id] || 0) + 1) }))}
                        disabled={currentPage >= totalPages - 1}
                        className="px-1.5 py-0.5 text-[10px] rounded dark:bg-zinc-900/60 bg-zinc-50 dark:text-zinc-500 text-zinc-500 dark:hover:text-zinc-300 dark:text-zinc-600 text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
      </div>
      )}

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
                className="mt-1.5 w-full dark:bg-zinc-900/60 bg-zinc-50 border dark:border-zinc-800 border-zinc-300 rounded-md px-3 py-2 text-sm dark:text-zinc-200 text-zinc-800 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 resize-none min-h-[60px]"
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
                <Label htmlFor="task-type">Tipo / SLA</Label>
                <Select
                  value={newTaskTypeId}
                  onValueChange={setNewTaskTypeId}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskTypes.map((tt) => (
                      <SelectItem key={tt.id} value={tt.id}>
                        {tt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(() => {
                  const tt = taskTypes.find(t => t.id === newTaskTypeId)
                  if (!tt) return null
                  const due = new Date(Date.now() + tt.slaMinutes * 60 * 1000)
                  const fmt = due.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                  const hours = Math.floor(tt.slaMinutes / 60)
                  const mins = tt.slaMinutes % 60
                  const slaFmt = hours > 0 ? `${hours}h${mins > 0 ? `${mins}m` : ''}` : `${mins}m`
                  return (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-400/90 bg-amber-500/8 border border-amber-500/15 rounded-md px-3 py-2">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      <span>Prazo SLA: <strong>{fmt}</strong> <span className="text-amber-500/70">({slaFmt})</span></span>
                    </div>
                  )
                })()}
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
          <div className="border-t dark:border-zinc-800/40 border-zinc-200 pt-4">
            <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" />
            {attachedFile ? (
              <div className="flex items-center gap-2 px-3 py-2 dark:bg-zinc-800/40 bg-zinc-100 rounded-md">
                <Paperclip className="w-3.5 h-3.5 dark:text-zinc-500 text-zinc-500" />
                <span className="text-xs dark:text-zinc-300 text-zinc-300 truncate flex-1">{attachedFile.name}</span>
                <button type="button" onClick={removeFile} className="dark:text-zinc-600 text-zinc-400 dark:hover:text-zinc-300 dark:text-zinc-600 text-zinc-400"><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 border border-dashed dark:border-zinc-700 border-zinc-300 rounded-md py-2 text-xs dark:text-zinc-500 text-zinc-500 hover:border-zinc-600 dark:hover:text-zinc-400 dark:text-zinc-600 text-zinc-400 transition-colors">
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
        members={members}
        completionStageId={completionStageId}
        userRole={userRole}
      />
    </>
  )
}
