import prisma from '@/lib/prisma'
import type { CreateTaskInput, UpdateTaskInput, TaskFilter, MoveTaskInput } from '@/types/task'
import * as taskHistoryService from '@/services/task-history'
import { sendTaskAssignedEmail, sendTaskCompletedEmail } from '@/lib/email'

export async function createTask(organizationId: string, data: CreateTaskInput, createdById?: string | null) {
  const taskType = data.taskTypeId
    ? await prisma.taskType.findFirst({ where: { id: data.taskTypeId, organizationId } })
    : null

  const dueDate = taskType ? new Date(Date.now() + taskType.slaMinutes * 60 * 1000) : null

  const task = await prisma.task.create({
    data: {
      organizationId,
      title: data.title,
      description: data.description,
      projectId: data.projectId,
      taskTypeId: data.taskTypeId,
      pipelineStageId: data.pipelineStageId,
      assignedToId: data.assignedToId,
      status: data.status,
      priority: data.priority,
      dueDate,
      sla: taskType ? {
        create: {
          dueAt: new Date(Date.now() + taskType.slaMinutes * 60 * 1000),
        },
      } : undefined,
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      taskType: true,
      pipelineStage: true,
      sla: true,
    },
  })

  // Register history
  await taskHistoryService.createTaskHistory(
    task.id,
    'CREATED',
    'Tarefa criada',
    createdById || null,
    { stage: data.pipelineStageId || null, assignee: data.assignedToId || null }
  )

  return task
}

export async function getTaskById(organizationId: string, taskId: string) {
  return prisma.task.findFirst({
    where: { id: taskId, organizationId },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } },
      taskType: true,
      pipelineStage: true,
      sla: true,
      timeEntries: {
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

export async function listTasks(organizationId: string, filter?: TaskFilter) {
  const where: any = { organizationId }

  if (filter?.status) where.status = filter.status
  if (filter?.priority) where.priority = filter.priority
  if (filter?.projectId) where.projectId = filter.projectId
  if (filter?.assignedToId) where.assignedToId = filter.assignedToId
  if (filter?.search) {
    where.OR = [
      { title: { contains: filter.search, mode: 'insensitive' } },
      { description: { contains: filter.search, mode: 'insensitive' } },
    ]
  }

  return prisma.task.findMany({
    where,
    include: {
      assignedTo: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      taskType: true,
      pipelineStage: true,
      sla: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function updateTask(organizationId: string, taskId: string, data: UpdateTaskInput, userId?: string | null) {
  const task = await prisma.task.findFirst({ where: { id: taskId, organizationId } })
  if (!task) throw new Error('Task not found')

  const isCompleting = data.status === 'DONE' && task.status !== 'DONE'

  const updateData: any = { ...data }

  // Handle dueDate conversion
  if ('dueDate' in data) {
    if (data.dueDate) {
      // If it's a string, convert to Date. If it's already a Date, use it. If null, set null.
      updateData.dueDate = typeof data.dueDate === 'string' ? new Date(data.dueDate) : data.dueDate
    } else if (data.dueDate === null) {
      updateData.dueDate = null
    } else {
      delete updateData.dueDate
    }
  }

  // Handle explicit completedAt (string → Date)
  if ('completedAt' in updateData && updateData.completedAt) {
    updateData.completedAt = new Date(updateData.completedAt)
  }

  if (isCompleting && !updateData.completedAt) {
    updateData.completedAt = new Date()
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: updateData,
    include: { sla: true },
  })

  // Register history for changes
  if (data.title && data.title !== task.title) {
    await taskHistoryService.createTaskHistory(taskId, 'TITLE_CHANGED', `Título alterado de "${task.title}" para "${data.title}"`, userId)
  }
  if (data.description !== task.description) {
    await taskHistoryService.createTaskHistory(taskId, 'DESCRIPTION_CHANGED', 'Descrição atualizada', userId)
  }
  if (data.status && data.status !== task.status) {
    await taskHistoryService.createTaskHistory(taskId, 'STATUS_CHANGED', `Status alterado de "${task.status}" para "${data.status}"`, userId)
  }
  if (data.priority && data.priority !== task.priority) {
    await taskHistoryService.createTaskHistory(taskId, 'PRIORITY_CHANGED', `Prioridade alterada de "${task.priority}" para "${data.priority}"`, userId)
  }
  if (data.assignedToId !== task.assignedToId) {
    await taskHistoryService.createTaskHistory(taskId, 'ASSIGNEE_CHANGED', `Responsável alterado`, userId, { from: task.assignedToId, to: data.assignedToId })
  }
  if (data.pipelineStageId && data.pipelineStageId !== task.pipelineStageId) {
    // Get stage names
    const oldStage = task.pipelineStageId ? await prisma.pipelineStage.findUnique({ where: { id: task.pipelineStageId } }) : null
    const newStage = await prisma.pipelineStage.findUnique({ where: { id: data.pipelineStageId } })
    await taskHistoryService.createTaskHistory(taskId, 'STAGE_CHANGED', `Movido de '${oldStage?.name || 'Sem etapa'}' para '${newStage?.name || 'Sem etapa'}'`, userId, { from: oldStage?.name, to: newStage?.name })
  }
  if (isCompleting) {
    await taskHistoryService.createTaskHistory(taskId, 'COMPLETED', 'Tarefa marcada como concluída', userId)
  }

  if (isCompleting && updatedTask.sla) {
    const now = new Date()
    const isBreached = now > updatedTask.sla.dueAt
    await prisma.sla.update({
      where: { taskId },
      data: {
        completedAt: now,
        breached: isBreached,
      },
    })
  }

  // ─── Email notifications (fire-and-forget) ────────────────────────────────

  // Assignment changed → notify new assignee
  const assigneeChanged = data.assignedToId !== undefined && data.assignedToId !== task.assignedToId && data.assignedToId
  if (assigneeChanged) {
    prisma.user.findUnique({
      where: { id: data.assignedToId! },
      select: { name: true, email: true },
    }).then(async assignee => {
      if (!assignee?.email) return
      const [proj, org] = await Promise.all([
        task.projectId ? prisma.project.findUnique({ where: { id: task.projectId }, select: { name: true } }) : null,
        prisma.organization.findUnique({ where: { id: organizationId }, select: { name: true } }),
      ])
      sendTaskAssignedEmail({
        taskId: task.id,
        taskTitle: task.title,
        taskDescription: task.description,
        projectName: proj?.name ?? 'Projeto',
        orgName: org?.name ?? 'Organização',
        priority: task.priority,
        assigneeName: assignee.name,
        assigneeEmail: assignee.email,
        requesterName: task.requesterName,
      })
    }).catch(() => {})
  }

  // Task completed → notify requester
  if (isCompleting && task.requesterEmail) {
    prisma.project.findUnique({
      where: { id: task.projectId ?? '' },
      select: { name: true, organizationId: true },
    }).then(async proj => {
      const org = proj ? await prisma.organization.findUnique({ where: { id: proj.organizationId }, select: { name: true } }) : null
      sendTaskCompletedEmail({
        taskId: task.id,
        taskTitle: task.title,
        projectName: proj?.name ?? 'Projeto',
        orgName: org?.name ?? 'Organização',
        requesterName: task.requesterName,
        requesterEmail: task.requesterEmail!,
      })
    }).catch(() => {})
  }

  return updatedTask
}

export async function moveTask(organizationId: string, taskId: string, data: MoveTaskInput) {
  return updateTask(organizationId, taskId, {
    pipelineStageId: data.pipelineStageId,
    status: data.status,
  })
}

export async function deleteTask(organizationId: string, taskId: string) {
  return prisma.task.delete({
    where: { id: taskId },
  })
}

export async function getTaskTypeStats(organizationId: string) {
  const tasksWithType = await prisma.task.findMany({
    where: { organizationId, taskTypeId: { not: null } },
    select: {
      taskTypeId: true,
      taskType: { select: { name: true, slaMinutes: true } },
      timeEntries: { select: { minutes: true } },
    },
  })

  const typeMap = new Map<string, { name: string; totalMinutes: number; taskCount: number; totalCost: number }>()

  for (const task of tasksWithType) {
    if (!task.taskTypeId || !task.taskType) continue
    
    const existing = typeMap.get(task.taskTypeId) || { name: task.taskType.name, totalMinutes: 0, taskCount: 0, totalCost: 0 }
    existing.taskCount += 1
    existing.totalMinutes += task.timeEntries.reduce((sum, t) => sum + t.minutes, 0)
    typeMap.set(task.taskTypeId, existing)
  }

  return Array.from(typeMap.entries()).map(([id, stats]) => ({
    taskTypeId: id,
    ...stats,
    avgMinutes: stats.taskCount > 0 ? Math.round(stats.totalMinutes / stats.taskCount) : 0,
  }))
}