'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Clock, User, Calendar, Flag, Hash, Save, X,
  ArrowRight, Plus, Send, Timer, MessageSquare, History, Loader2,
  CheckCircle2, Trash2, Edit2, Paperclip, FileText, Mail, BookOpen, Sparkles
} from 'lucide-react'
import TaskHistoryLog from '@/components/task/history-log'

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  assignedToId: string | null
  assignedTo: { id: string; name: string } | null
  projectId: string | null
  project: { id: string; name: string } | null
  createdAt: string
  completedAt: string | null
  pipelineStageId: string | null
  requesterName: string | null
  requesterEmail: string | null
  taskTypeId: string | null
  taskType: { id: string; name: string; slaMinutes: number | null } | null
  dueDate: string | null
}

interface Stage {
  id: string
  name: string
  order: number
}

interface TimeEntry {
  id: string
  minutes: number
  description: string | null
  createdAt: string
  user: { name: string } | null
}

interface Comment {
  id: string
  content: string
  createdAt: string
  author: { id: string; name: string; email: string } | null
}

interface Attachment {
  id: string
  name: string
  fileUrl: string
  fileSize: number
  mimeType: string
  createdAt: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  TODO: { label: 'A Fazer', className: 'bg-slate-500/10 text-slate-400' },
  IN_PROGRESS: { label: 'Em Progresso', className: 'bg-blue-500/10 text-blue-400' },
  IN_REVIEW: { label: 'Em Revisão', className: 'bg-amber-500/10 text-amber-400' },
  DONE: { label: 'Concluído', className: 'bg-emerald-500/10 text-emerald-400' },
  CANCELLED: { label: 'Cancelado', className: 'bg-red-500/10 text-red-400' },
}

const priorityConfig: Record<string, { label: string; className: string }> = {
  LOW: { label: 'Baixa', className: 'bg-slate-500/10 text-slate-400' },
  MEDIUM: { label: 'Média', className: 'bg-blue-500/10 text-blue-400' },
  HIGH: { label: 'Alta', className: 'bg-orange-500/10 text-orange-400' },
  URGENT: { label: 'Urgente', className: 'bg-red-500/10 text-red-400' },
}

export default function TaskDetailModal({
  open,
  onOpenChange,
  taskId,
  initialTask,
  onUpdate,
  taskIds,
  stages,
  members,
  completionStageId,
  userRole,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskId: string | null
  initialTask: Task | null
  onUpdate?: () => void
  taskIds?: string[]
  stages?: Stage[]
  members?: { id: string; name: string }[]
  completionStageId?: string | null
  userRole?: string
}) {
  const router = useRouter()
  const [task, setTask] = useState<Task | null>(initialTask)
  const [loading, setLoading] = useState(!initialTask)
  const [activeTab, setActiveTab] = useState('details')

  // Edit state
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editPriority, setEditPriority] = useState('')
  const [editAssignedToId, setEditAssignedToId] = useState<string | null>(null)
  const [editDueDate, setEditDueDate] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)

  // Time entries - keyed by taskId to preserve when navigating
  const [timeEntriesMap, setTimeEntriesMap] = useState<Record<string, TimeEntry[]>>({})
  const [timeMinutes, setTimeMinutes] = useState('')
  const [timeDesc, setTimeDesc] = useState('')
  const [submittingTime, setSubmittingTime] = useState(false)

  // Comments - keyed by taskId
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({})
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  // Attachments - keyed by taskId
  const [attachmentsMap, setAttachmentsMap] = useState<Record<string, Attachment[]>>({})
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Elapsed time
  const [elapsedTime, setElapsedTime] = useState({ hours: 0, minutes: 0, totalMinutes: 0 })

  // Stage confirmation dialog
  const [showStageConfirm, setShowStageConfirm] = useState(false)
  const [nextStage, setNextStage] = useState<Stage | null>(null)
  const [completionDate, setCompletionDate] = useState('')

  // Project members for assignee select
  const [projectMembers, setProjectMembers] = useState<{ id: string; name: string }[]>([])

  // KB article generation
  const [generatingKb, setGeneratingKb] = useState(false)
  const [showKbDialog, setShowKbDialog] = useState(false)
  const [kbDraft, setKbDraft] = useState<{
    title: string
    content: string
    suggestedCategoryId: string | null
    suggestedCategoryName: string | null
    categories: { id: string; name: string }[]
  } | null>(null)
  const [kbCategoryId, setKbCategoryId] = useState<string | null>(null)
  const [savingKb, setSavingKb] = useState(false)

  // Delete task
  const [deletingTask, setDeletingTask] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const timeEntries = task ? (timeEntriesMap[task.id] || []) : []
  const comments = task ? (commentsMap[task.id] || []) : []
  const attachments = task ? (attachmentsMap[task.id] || []) : []

  const fetchTask = useCallback(async (id: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/tasks/${id}`)
      if (res.ok) {
        const data = await res.json()
        setTask(data)
      }
    } catch (e) {
      console.error('Failed to fetch task:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTimeEntries = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/time-entries?taskId=${id}`)
      if (res.ok) {
        const data = await res.json()
        setTimeEntriesMap(prev => ({ ...prev, [id]: data }))
      }
    } catch (e) {
      console.error('Failed to fetch time entries:', e)
    }
  }, [])

  const fetchComments = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}/comments`)
      if (res.ok) {
        const data = await res.json()
        setCommentsMap(prev => ({ ...prev, [id]: data }))
      }
    } catch (e) {
      console.error('Failed to fetch comments:', e)
    }
  }, [])

  const fetchAttachments = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}/attachments`)
      if (res.ok) {
        const data = await res.json()
        setAttachmentsMap(prev => ({ ...prev, [id]: data }))
      }
    } catch (e) {
      console.error('Failed to fetch attachments:', e)
    }
  }, [])

  useEffect(() => {
    if (open && taskId && !initialTask) {
      fetchTask(taskId)
    } else if (initialTask) {
      setTask(initialTask)
      setLoading(false)
    }
  }, [open, taskId, initialTask, fetchTask])

  useEffect(() => {
    if (task && open) {
      setEditTitle(task.title)
      setEditDescription(task.description || '')
      setEditStatus(task.status)
      setEditPriority(task.priority)
      setEditAssignedToId(task.assignedToId)
      setEditDueDate(task.dueDate ? task.dueDate.split('T')[0] : '')
      setEditMode(false)
      setActiveTab('details')
      fetchTimeEntries(task.id)
      fetchComments(task.id)
      fetchAttachments(task.id)
    }
  }, [task, open, fetchTimeEntries, fetchComments, fetchAttachments])

  // Elapsed time
  useEffect(() => {
    if (task) {
      const startTime = new Date(task.createdAt).getTime()
      const updateTime = () => {
        const now = Date.now()
        const diffMs = now - startTime
        const totalMinutes = Math.floor(diffMs / 60000)
        const hours = Math.floor(totalMinutes / 60)
        const minutes = totalMinutes % 60
        setElapsedTime({ hours, minutes, totalMinutes })
      }
      updateTime()
      const interval = setInterval(updateTime, 60000)
      return () => clearInterval(interval)
    }
  }, [task])

  // Fetch project members when entering edit mode
  useEffect(() => {
    if (editMode && task?.projectId) {
      const membersSource = members && members.length > 0 ? members : null
      if (membersSource) {
        setProjectMembers(membersSource)
      } else {
        fetch(`/api/projects/${task.projectId}/members`)
          .then(r => r.ok ? r.json() : [])
          .then((data: any[]) => setProjectMembers(data.map(m => ({ id: m.user.id, name: m.user.name }))))
          .catch(() => setProjectMembers([]))
      }
    }
  }, [editMode, task?.projectId, members])

  const handleSave = async () => {
    if (!task || !editTitle.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          status: editStatus,
          priority: editPriority,
          assignedToId: editAssignedToId,
          dueDate: editDueDate || null,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setTask(updated)
        setEditMode(false)
        onUpdate?.()
        router.refresh()
      }
    } catch (e) {
      console.error('Failed to save:', e)
    } finally {
      setSaving(false)
    }
  }

  const handleAddTimeEntry = async () => {
    if (!task || !timeMinutes) return
    setSubmittingTime(true)
    try {
      const res = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          minutes: parseInt(timeMinutes),
          description: timeDesc.trim() || null,
        }),
      })
      if (res.ok) {
        const entry = await res.json()
        setTimeEntriesMap(prev => ({
          ...prev,
          [task.id]: [entry, ...(prev[task.id] || [])],
        }))
        setTimeMinutes('')
        setTimeDesc('')
        onUpdate?.()
      }
    } catch (e) {
      console.error('Failed to add time:', e)
    } finally {
      setSubmittingTime(false)
    }
  }

  const handleDeleteTimeEntry = async (entryId: string) => {
    if (!task) return
    try {
      const res = await fetch(`/api/time-entries/${entryId}`, { method: 'DELETE' })
      if (res.ok) {
        setTimeEntriesMap(prev => ({
          ...prev,
          [task.id]: (prev[task.id] || []).filter(e => e.id !== entryId),
        }))
      }
    } catch (e) {
      console.error('Failed to delete time entry:', e)
    }
  }

  const handleAddComment = async () => {
    if (!task || !newComment.trim()) return
    setSubmittingComment(true)
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      })
      if (res.ok) {
        const comment = await res.json()
        setCommentsMap(prev => ({
          ...prev,
          [task.id]: [...(prev[task.id] || []), comment],
        }))
        setNewComment('')
      }
    } catch (e) {
      console.error('Failed to add comment:', e)
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !task) return

    setUploadingAttachment(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/tasks/${task.id}/attachments`, {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const attachment = await res.json()
        setAttachmentsMap(prev => ({
          ...prev,
          [task.id]: [...(prev[task.id] || []), attachment],
        }))
      }
    } catch (err) {
      console.error('Failed to upload attachment:', err)
    } finally {
      setUploadingAttachment(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!task) return
    try {
      const res = await fetch(`/api/tasks/${task.id}/attachments?attachmentId=${attachmentId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setAttachmentsMap(prev => ({
          ...prev,
          [task.id]: (prev[task.id] || []).filter(a => a.id !== attachmentId),
        }))
      }
    } catch (e) {
      console.error('Failed to delete attachment:', e)
    }
  }

  const handleNextTask = () => {
    if (!taskIds || !task) return
    const idx = taskIds.indexOf(task.id)
    if (idx < taskIds.length - 1) {
      fetchTask(taskIds[idx + 1])
    }
  }

  const handlePrevTask = () => {
    if (!taskIds || !task) return
    const idx = taskIds.indexOf(task.id)
    if (idx > 0) {
      fetchTask(taskIds[idx - 1])
    }
  }

  const handleNextStageClick = () => {
    if (!task || !stages || !task.pipelineStageId) return
    const currentStage = stages.find(s => s.id === task.pipelineStageId)
    if (!currentStage) return
    const next = stages.find(s => s.order === currentStage.order + 1)
    if (!next) return

    setNextStage(next)

    // Pre-fill today's date for completion confirmation
    if (next.id === completionStageId) {
      setCompletionDate(new Date().toISOString().split('T')[0])
    }

    setShowStageConfirm(true)
  }

  const confirmNextStage = async () => {
    if (!task || !nextStage || !stages) return
    setShowStageConfirm(false)

    const currentNextStage = nextStage
    const isCompletion = currentNextStage.id === completionStageId
    setNextStage(null)

    try {
      const body: Record<string, any> = { pipelineStageId: currentNextStage.id }
      if (isCompletion) {
        body.status = 'DONE'
        body.completedAt = completionDate
          ? new Date(completionDate + 'T12:00:00').toISOString()
          : new Date().toISOString()
      }

      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const updated = await res.json()
        setTask(updated)
        onUpdate?.()
      }
    } catch (e) {
      console.error('Failed to advance stage:', e)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setTask(null)
    setEditMode(false)
  }

  const handleDeleteTask = async () => {
    if (!task) return
    setDeletingTask(true)
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        onOpenChange(false)
        onUpdate?.()
        router.refresh()
      }
    } catch (e) {
      console.error('Failed to delete task:', e)
    } finally {
      setDeletingTask(false)
      setShowDeleteConfirm(false)
    }
  }

  const generateKbArticle = async () => {
    if (!task) return
    setGeneratingKb(true)
    try {
      const res = await fetch(`/api/tasks/${task.id}/generate-kb`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setKbDraft(data)
        setKbCategoryId(data.suggestedCategoryId || null)
        setShowKbDialog(true)
      }
    } catch (e) {
      console.error('Failed to generate KB article:', e)
    } finally {
      setGeneratingKb(false)
    }
  }

  const handleSaveKbArticle = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!kbDraft) return
    setSavingKb(true)
    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: kbDraft.title,
          content: kbDraft.content,
          status,
          categoryId: kbCategoryId || null,
        }),
      })
      if (res.ok) {
        setShowKbDialog(false)
        setKbDraft(null)
      }
    } catch (e) {
      console.error('Failed to save KB article:', e)
    } finally {
      setSavingKb(false)
    }
  }

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h > 0) return `${h}h ${m > 0 ? `${m}m` : ''}`
    return `${m}m`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / 1048576).toFixed(1)}MB`
  }

  const timeShortcuts = [
    { label: '30min', value: 30 },
    { label: '1h', value: 60 },
    { label: '2h', value: 120 },
    { label: '4h', value: 240 },
    { label: '6h', value: 360 },
    { label: '8h', value: 480 },
  ]

  if (!open || !taskId) return null

  const hasNextTask = taskIds && task ? taskIds.indexOf(task.id) < taskIds.length - 1 : false
  const hasPrevTask = taskIds && task ? taskIds.indexOf(task.id) > 0 : false
  const currentStageOrder = task?.pipelineStageId
    ? (stages?.find(st => st.id === task.pipelineStageId)?.order ?? -1)
    : -1
  const nextStageCandidateId = stages?.find(s => s.order === currentStageOrder + 1)?.id
  const hasNextStage = task?.status !== 'DONE'
    && task?.status !== 'CANCELLED'
    && !!nextStageCandidateId
  const nextStageIsCompletion = nextStageCandidateId === completionStageId

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="!max-w-[95vw] !w-[95vw] !max-h-[92vh] !h-[92vh] !p-0 !flex !flex-col !overflow-hidden" showCloseButton={false}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800/40 bg-zinc-900/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            {hasPrevTask && (
              <Button size="sm" variant="ghost" onClick={handlePrevTask} className="h-7 px-2 text-xs">
                ← Anterior
              </Button>
            )}
            {hasNextTask && (
              <Button size="sm" variant="ghost" onClick={handleNextTask} className="h-7 px-2 text-xs">
                Próxima →
              </Button>
            )}
            {hasNextStage && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleNextStageClick}
                className={`h-7 px-2 text-xs ${nextStageIsCompletion ? 'text-emerald-400 hover:text-emerald-300' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                {nextStageIsCompletion
                  ? <><CheckCircle2 className="w-3 h-3 mr-1" /> Concluir Tarefa</>
                  : <><ArrowRight className="w-3 h-3 mr-1" /> Avançar etapa</>
                }
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!editMode && task?.status === 'DONE' && (
              <Button
                size="sm"
                variant="outline"
                onClick={generateKbArticle}
                disabled={generatingKb}
                className="h-7 px-3 text-xs border-violet-500/30 text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
              >
                {generatingKb
                  ? <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  : <Sparkles className="w-3 h-3 mr-1" />}
                Gerar Artigo KB
              </Button>
            )}
            {!editMode && task && (
              <Button size="sm" variant="outline" onClick={() => setEditMode(true)} className="h-7 px-3 text-xs">
                <Edit2 className="w-3 h-3 mr-1" />
                Editar
              </Button>
            )}
            {!editMode && task && (userRole === 'OWNER' || userRole === 'ADMIN') && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDeleteConfirm(true)}
                className="h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={handleClose} className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-300">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Header */}
        <DialogHeader className="px-6 py-4 flex-shrink-0">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              {editMode ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-zinc-900/60 border-zinc-700 text-lg font-semibold"
                  placeholder="Título da tarefa"
                  autoFocus
                />
              ) : (
                <DialogTitle className="text-lg font-semibold text-zinc-100">
                  {task?.title || 'Carregando...'}
                </DialogTitle>
              )}
              <div className="flex items-center gap-3 mt-1">
                {task?.project && (
                  <p className="text-xs text-zinc-500">{task.project.name}</p>
                )}
                {task?.requesterName && (
                  <div className="flex items-center gap-1 text-xs text-zinc-600">
                    <User className="w-3 h-3" />
                    <span>{task.requesterName}</span>
                    {task.requesterEmail && (
                      <>
                        <Mail className="w-3 h-3 ml-1" />
                        <span>{task.requesterEmail}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {task && !editMode && (
                <>
                  <Badge variant="outline" className={`text-xs px-2.5 py-1 ${statusConfig[task.status]?.className || statusConfig.TODO.className}`}>
                    {statusConfig[task.status]?.label || task.status}
                  </Badge>
                  <Badge variant="outline" className={`text-xs px-2.5 py-1 ${priorityConfig[task.priority]?.className || priorityConfig.MEDIUM.className}`}>
                    {priorityConfig[task.priority]?.label || task.priority}
                  </Badge>
                  {task.dueDate && (() => {
                    const isOverdue = new Date(task.dueDate!) < new Date() && task.status !== 'DONE' && task.status !== 'CANCELLED'
                    return (
                      <Badge variant="outline" className={`text-xs px-2.5 py-1 ${isOverdue ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/40'}`}>
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                        {isOverdue && ' (Atrasada)'}
                      </Badge>
                    )
                  })()}
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800/60 rounded text-xs text-zinc-400">
                    <Clock className="w-3 h-3" />
                    <span className="tabular-nums">
                      {elapsedTime.hours > 0 ? `${elapsedTime.hours}h` : ''}{elapsedTime.minutes}m
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Content area */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-6 h-6 text-zinc-600 mx-auto mb-2 animate-spin" />
              <p className="text-sm text-zinc-600">Carregando...</p>
            </div>
          </div>
        ) : task ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
              <div className="px-6 flex-shrink-0">
                <TabsList className="bg-transparent border-0 border-b border-zinc-800/40 p-0 gap-0 h-9 rounded-none w-full justify-start">
                  <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent data-active:border-zinc-400 data-active:bg-transparent data-active:text-zinc-200 text-zinc-500 text-sm h-9 px-3">
                    <Hash className="w-3.5 h-3.5 mr-1.5" />
                    Detalhes
                  </TabsTrigger>
                  <TabsTrigger value="time" className="rounded-none border-b-2 border-transparent data-active:border-zinc-400 data-active:bg-transparent data-active:text-zinc-200 text-zinc-500 text-sm h-9 px-3">
                    <Timer className="w-3.5 h-3.5 mr-1.5" />
                    Horas ({timeEntries.length})
                  </TabsTrigger>
                  <TabsTrigger value="comments" className="rounded-none border-b-2 border-transparent data-active:border-zinc-400 data-active:bg-transparent data-active:text-zinc-200 text-zinc-500 text-sm h-9 px-3">
                    <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                    Comentários ({comments.length})
                  </TabsTrigger>
                  <TabsTrigger value="attachments" className="rounded-none border-b-2 border-transparent data-active:border-zinc-400 data-active:bg-transparent data-active:text-zinc-200 text-zinc-500 text-sm h-9 px-3">
                    <Paperclip className="w-3.5 h-3.5 mr-1.5" />
                    Anexos ({attachments.length})
                  </TabsTrigger>
                  <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-active:border-zinc-400 data-active:bg-transparent data-active:text-zinc-200 text-zinc-500 text-sm h-9 px-3">
                    <History className="w-3.5 h-3.5 mr-1.5" />
                    Histórico
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                {/* Details Tab */}
                <TabsContent value="details" className="mt-0 h-full">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                      <div>
                        <h3 className="text-sm font-medium text-zinc-400 mb-2">Descrição</h3>
                        {editMode ? (
                          <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full bg-zinc-900/60 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-600 resize-none min-h-[200px]" placeholder="Descreva os detalhes da tarefa..." />
                        ) : task.description ? (
                          <div className="bg-zinc-900/30 border border-zinc-800/40 rounded-lg px-4 py-3">
                            <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{task.description}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-zinc-600 italic bg-zinc-900/20 rounded-lg px-4 py-3">Nenhuma descrição</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {editMode ? (
                        <div className="bg-zinc-900/40 rounded-lg p-4 space-y-4 border border-zinc-800/40">
                          <h3 className="text-sm font-medium text-zinc-300">Editar Informações</h3>
                          <div>
                            <Label className="text-xs text-zinc-400">Status</Label>
                            <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="mt-1 w-full bg-zinc-900/60 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-600">
                              {Object.entries(statusConfig).map(([key, val]) => (<option key={key} value={key}>{val.label}</option>))}
                            </select>
                          </div>
                          <div>
                            <Label className="text-xs text-zinc-400">Prioridade</Label>
                            <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)} className="mt-1 w-full bg-zinc-900/60 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-600">
                              {Object.entries(priorityConfig).map(([key, val]) => (<option key={key} value={key}>{val.label}</option>))}
                            </select>
                          </div>
                          <div>
                            <Label className="text-xs text-zinc-400">Responsável</Label>
                            <select value={editAssignedToId || ''} onChange={(e) => setEditAssignedToId(e.target.value || null)} className="mt-1 w-full bg-zinc-900/60 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-600">
                              <option value="">Sem responsável</option>
                              {projectMembers.length > 0
                                ? projectMembers.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                  ))
                                : task.assignedTo && (
                                    <option value={task.assignedTo.id}>{task.assignedTo.name}</option>
                                  )
                              }
                              {/* If current assignee is not in project members, still include them */}
                              {projectMembers.length > 0 && task.assignedTo && !projectMembers.find(m => m.id === task.assignedTo!.id) && (
                                <option value={task.assignedTo.id}>{task.assignedTo.name}</option>
                              )}
                            </select>
                          </div>
                          <div>
                            <Label className="text-xs text-zinc-400">Data de Vencimento</Label>
                            <input
                              type="date"
                              value={editDueDate || ''}
                              onChange={(e) => setEditDueDate(e.target.value)}
                              className="mt-1 w-full bg-zinc-900/60 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                            />
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button onClick={handleSave} disabled={saving || !editTitle.trim()} className="flex-1">{saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}Salvar</Button>
                            <Button variant="outline" onClick={() => setEditMode(false)} className="px-3"><X className="w-4 h-4" /></Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="bg-zinc-900/40 rounded-lg p-4 space-y-3 border border-zinc-800/40">
                            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Informações</h3>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-zinc-500">Status</span>
                              <Badge variant="outline" className={`text-xs ${statusConfig[task.status]?.className}`}>{statusConfig[task.status]?.label}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-zinc-500">Prioridade</span>
                              <Badge variant="outline" className={`text-xs ${priorityConfig[task.priority]?.className}`}>{priorityConfig[task.priority]?.label}</Badge>
                            </div>
                            {task.taskType && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-zinc-500">Tipo</span>
                                <Badge variant="outline" className="text-xs bg-zinc-800/60 text-zinc-400 border-zinc-700/40">{task.taskType.name}</Badge>
                              </div>
                            )}
                            {task.assignedTo && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-zinc-500">Responsável</span>
                                <span className="text-xs text-zinc-300">{task.assignedTo.name}</span>
                              </div>
                            )}
                          </div>
                          <div className="bg-zinc-900/40 rounded-lg p-4 space-y-3 border border-zinc-800/40">
                            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Datas</h3>
                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Criado em {new Date(task.createdAt).toLocaleDateString('pt-BR')}</span>
                            </div>
                            {task.dueDate && (() => {
                              const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'DONE' && task.status !== 'CANCELLED'
                              return (
                                <div className="flex items-center gap-2 text-xs">
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span className={isOverdue ? 'text-red-400 font-medium' : 'text-zinc-500'}>
                                    Vencimento: {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                                    {isOverdue && ' (Atrasada)'}
                                  </span>
                                </div>
                              )
                            })()}
                            {task.completedAt && (
                              <div className="flex items-center gap-2 text-xs text-zinc-500">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Concluído em {new Date(task.completedAt).toLocaleDateString('pt-BR')}</span>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Time Tab */}
                <TabsContent value="time" className="mt-0 h-full">
                  <div className="max-w-3xl space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-zinc-900/40 rounded-lg p-4 border border-zinc-800/40 text-center">
                        <p className="text-xs text-zinc-500 mb-1">Tempo registrado</p>
                        <p className="text-xl font-bold text-zinc-200">{formatTime(timeEntries.reduce((sum, e) => sum + e.minutes, 0))}</p>
                      </div>
                      <div className="bg-zinc-900/40 rounded-lg p-4 border border-zinc-800/40 text-center">
                        <p className="text-xs text-zinc-500 mb-1">Tempo decorrido</p>
                        <p className="text-xl font-bold text-zinc-200">{elapsedTime.hours > 0 ? `${elapsedTime.hours}h` : ''}{elapsedTime.minutes > 0 ? `${elapsedTime.minutes}m` : '0m'}</p>
                      </div>
                      <div className="bg-zinc-900/40 rounded-lg p-4 border border-zinc-800/40 text-center">
                        <p className="text-xs text-zinc-500 mb-1">Registros</p>
                        <p className="text-xl font-bold text-zinc-200">{timeEntries.length}</p>
                      </div>
                    </div>

                    <div className="bg-zinc-900/40 rounded-lg p-4 border border-zinc-800/40">
                      <h3 className="text-sm font-medium text-zinc-300 mb-3">Registrar tempo</h3>
                      {/* Shortcuts */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {timeShortcuts.map(sc => (
                          <button
                            key={sc.value}
                            onClick={() => setTimeMinutes(sc.value.toString())}
                            className={`px-2.5 py-1 rounded text-xs font-medium border transition-all ${
                              timeMinutes === sc.value.toString()
                                ? 'bg-zinc-700 border-zinc-600 text-zinc-200'
                                : 'bg-zinc-800/40 border-zinc-700/40 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
                            }`}
                          >
                            {sc.label}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-3">
                        <div className="flex gap-2 flex-1">
                          <Input type="number" value={timeMinutes} onChange={(e) => setTimeMinutes(e.target.value)} placeholder="Minutos" className="w-28 bg-zinc-900/60 border-zinc-700" />
                          <Input value={timeDesc} onChange={(e) => setTimeDesc(e.target.value)} placeholder="Descrição (opcional)" className="flex-1 bg-zinc-900/60 border-zinc-700" />
                        </div>
                        <Button onClick={handleAddTimeEntry} disabled={submittingTime || !timeMinutes}><Plus className="w-4 h-4 mr-1" />Registrar</Button>
                      </div>
                    </div>

                    {timeEntries.length > 0 ? (
                      <div className="space-y-2">
                        {timeEntries.map((entry) => (
                          <div key={entry.id} className="flex items-start gap-3 px-4 py-3 bg-zinc-900/30 rounded-lg border border-zinc-800/30">
                            <div className="w-9 h-9 bg-zinc-800/60 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"><Clock className="w-4 h-4 text-zinc-500" /></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-base font-semibold text-zinc-200">{formatTime(entry.minutes)}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-zinc-600">{new Date(entry.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                  <button onClick={() => handleDeleteTimeEntry(entry.id)} className="text-zinc-700 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                              {entry.description && <p className="text-sm text-zinc-400 mt-1">{entry.description}</p>}
                              {entry.user && <p className="text-xs text-zinc-600 mt-1">{entry.user.name}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-zinc-900/20 rounded-lg border border-zinc-800/30">
                        <Timer className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                        <p className="text-sm text-zinc-600">Nenhum registro de tempo</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Comments Tab */}
                <TabsContent value="comments" className="mt-0 h-full">
                  <div className="max-w-3xl space-y-4">
                    <div className="bg-zinc-900/40 rounded-lg p-4 border border-zinc-800/40">
                      <h3 className="text-sm font-medium text-zinc-300 mb-3">Adicionar comentário</h3>
                      <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment() } }} placeholder="Escreva um comentário..." className="w-full bg-zinc-900/60 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 resize-none min-h-[80px]" />
                      <div className="flex justify-end mt-2">
                        <Button onClick={handleAddComment} disabled={submittingComment || !newComment.trim()}><Send className="w-4 h-4 mr-1" />Enviar</Button>
                      </div>
                    </div>

                    {comments.length > 0 ? (
                      <div className="space-y-2">
                        {comments.map((comment) => (
                          <div key={comment.id} className="flex items-start gap-3 px-4 py-3 bg-zinc-900/30 rounded-lg border border-zinc-800/30">
                            <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center flex-shrink-0"><User className="w-4 h-4 text-zinc-400" /></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-zinc-300">{comment.author?.name || 'Anônimo'}</span>
                                <span className="text-xs text-zinc-600">{new Date(comment.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-sm text-zinc-400 whitespace-pre-wrap mt-1.5">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-zinc-900/20 rounded-lg border border-zinc-800/30">
                        <MessageSquare className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                        <p className="text-sm text-zinc-600">Nenhum comentário ainda</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Attachments Tab */}
                <TabsContent value="attachments" className="mt-0 h-full">
                  <div className="max-w-3xl space-y-4">
                    <div className="bg-zinc-900/40 rounded-lg p-4 border border-zinc-800/40">
                      <h3 className="text-sm font-medium text-zinc-300 mb-3">Anexar arquivo</h3>
                      <input ref={fileInputRef} type="file" onChange={handleAttachmentUpload} className="hidden" />
                      <button onClick={() => fileInputRef.current?.click()} disabled={uploadingAttachment} className="w-full border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center hover:border-zinc-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                        {uploadingAttachment ? (
                          <div className="flex flex-col items-center gap-2"><Loader2 className="w-5 h-5 text-zinc-400 animate-spin" /><p className="text-sm text-zinc-400">Enviando...</p></div>
                        ) : (
                          <div className="flex flex-col items-center gap-2"><Paperclip className="w-5 h-5 text-zinc-500" /><p className="text-sm text-zinc-400">Clique para selecionar um arquivo</p></div>
                        )}
                      </button>
                    </div>

                    {attachments.length > 0 ? (
                      <div className="space-y-2">
                        {attachments.map((att) => (
                          <div key={att.id} className="flex items-center gap-3 px-4 py-3 bg-zinc-900/30 rounded-lg border border-zinc-800/30">
                            <div className="w-9 h-9 bg-zinc-800/60 rounded-full flex items-center justify-center flex-shrink-0"><FileText className="w-4 h-4 text-zinc-500" /></div>
                            <div className="flex-1 min-w-0">
                              <a href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-200 hover:text-zinc-100 truncate block">{att.name}</a>
                              <span className="text-xs text-zinc-600">{formatFileSize(att.fileSize)} • {new Date(att.createdAt).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <button onClick={() => handleDeleteAttachment(att.id)} className="text-zinc-700 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-zinc-900/20 rounded-lg border border-zinc-800/30">
                        <Paperclip className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                        <p className="text-sm text-zinc-600">Nenhum anexo</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="mt-0 h-full">
                  <div className="max-w-3xl">
                    <TaskHistoryLog taskId={task.id} />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-zinc-600">Tarefa não encontrada</p>
          </div>
        )}
      </DialogContent>

      {/* Stage Confirmation Dialog */}
      <Dialog open={showStageConfirm} onOpenChange={setShowStageConfirm}>
        <DialogContent className="max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {nextStage?.id === completionStageId
                ? <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Confirmar Conclusão</>
                : <><ArrowRight className="w-4 h-4" /> Avançar Etapa</>
              }
            </DialogTitle>
          </DialogHeader>
          {nextStage?.id === completionStageId ? (
            <div className="py-2 space-y-4">
              <p className="text-sm text-zinc-400">
                Esta tarefa será movida para{' '}
                <span className="font-medium text-zinc-200">"{nextStage?.name}"</span>{' '}
                e marcada como concluída. A data registrada será usada no relatório de assertividade de SLA.
              </p>
              <div>
                <Label className="text-xs text-zinc-400">Data de conclusão</Label>
                <input
                  type="date"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  className="mt-1.5 w-full bg-zinc-900/60 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                />
              </div>
            </div>
          ) : (
            <div className="py-4">
              <p className="text-sm text-zinc-400">
                Deseja mover esta tarefa para a etapa{' '}
                <span className="font-medium text-zinc-200">"{nextStage?.name}"</span>?
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setShowStageConfirm(false); setNextStage(null) }}>Cancelar</Button>
            <Button
              onClick={confirmNextStage}
              className={nextStage?.id === completionStageId ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
            >
              {nextStage?.id === completionStageId ? 'Concluir Tarefa' : 'Confirmar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Delete Task Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <Trash2 className="w-5 h-5" />
              Excluir Tarefa
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-zinc-300 mb-2">
              Tem certeza que deseja excluir a tarefa <strong className="text-zinc-100">"{task?.title}"</strong>?
            </p>
            <p className="text-xs text-zinc-500">
              Esta ação não pode ser desfeita. Todas as horas registradas, comentários e anexos serão removidos permanentemente.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={deletingTask}>
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteTask}
              disabled={deletingTask}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletingTask ? (
                <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Excluindo...</>
              ) : (
                <><Trash2 className="w-3 h-3 mr-1" /> Excluir</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* KB Article Review Dialog */}
      <Dialog open={showKbDialog} onOpenChange={setShowKbDialog}>
        <DialogContent className="max-w-2xl !max-h-[85vh] !flex !flex-col !overflow-hidden" showCloseButton={false}>
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-violet-400" />
              Artigo Gerado por IA
            </DialogTitle>
            <p className="text-xs text-zinc-500 mt-1">Revise e edite o conteúdo antes de salvar na base de conhecimento.</p>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            <div>
              <Label className="text-xs text-zinc-400">Título</Label>
              <input
                type="text"
                value={kbDraft?.title || ''}
                onChange={(e) => setKbDraft(prev => prev ? { ...prev, title: e.target.value } : null)}
                className="mt-1.5 w-full bg-zinc-900/60 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-600"
              />
            </div>
            <div>
              <Label className="text-xs text-zinc-400">Categoria</Label>
              <select
                value={kbCategoryId || ''}
                onChange={(e) => setKbCategoryId(e.target.value || null)}
                className="mt-1.5 w-full bg-zinc-900/60 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-600"
              >
                <option value="">Sem categoria</option>
                {kbDraft?.categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {kbDraft?.suggestedCategoryName && (
                <p className="text-xs text-violet-400/80 mt-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  IA sugeriu: <strong>{kbDraft.suggestedCategoryName}</strong>
                </p>
              )}
            </div>
            <div>
              <Label className="text-xs text-zinc-400">Conteúdo (Markdown)</Label>
              <textarea
                value={kbDraft?.content || ''}
                onChange={(e) => setKbDraft(prev => prev ? { ...prev, content: e.target.value } : null)}
                className="mt-1.5 w-full bg-zinc-900/60 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-600 resize-none min-h-[280px] font-mono text-xs leading-relaxed"
              />
            </div>
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-zinc-800/40 flex-shrink-0">
            <Button variant="ghost" onClick={() => setShowKbDialog(false)} className="text-zinc-400">
              Cancelar
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleSaveKbArticle('DRAFT')}
                disabled={savingKb || !kbDraft?.title}
              >
                {savingKb ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                Salvar Rascunho
              </Button>
              <Button
                onClick={() => handleSaveKbArticle('PUBLISHED')}
                disabled={savingKb || !kbDraft?.title}
                className="bg-violet-600 hover:bg-violet-700 text-white border-0"
              >
                {savingKb ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <BookOpen className="w-3 h-3 mr-1" />}
                Publicar na KB
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}

function statusFromStageOrder(order: number, totalStages: number): string {
  if (totalStages <= 1) return 'TODO'
  const ratio = order / (totalStages - 1)
  if (ratio <= 0) return 'TODO'
  if (ratio <= 0.33) return 'IN_PROGRESS'
  if (ratio <= 0.66) return 'IN_REVIEW'
  return 'DONE'
}
