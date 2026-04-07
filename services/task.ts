import prisma from '@/lib/prisma'
import type { CreateTaskInput, UpdateTaskInput, TaskFilter, MoveTaskInput } from '@/types/task'

export async function createTask(organizationId: string, data: CreateTaskInput) {
  const taskType = data.taskTypeId 
    ? await prisma.taskType.findFirst({ where: { id: data.taskTypeId, organizationId } })
    : null

  return prisma.task.create({
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

export async function updateTask(organizationId: string, taskId: string, data: UpdateTaskInput) {
  const task = await prisma.task.findFirst({ where: { id: taskId, organizationId } })
  if (!task) throw new Error('Task not found')

  const isCompleting = data.status === 'DONE' && task.status !== 'DONE'

  return prisma.task.update({
    where: { id: taskId },
    data: {
      ...data,
      completedAt: isCompleting ? new Date() : undefined,
      sla: isCompleting ? {
        update: {
          completedAt: new Date(),
          breached: {
            connect: { taskId },
            update: {
              breached: {
                where: { taskId },
                data: { breached: true },
              },
            },
          },
        },
      } : undefined,
    },
    include: {
      sla: true,
    },
  })
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