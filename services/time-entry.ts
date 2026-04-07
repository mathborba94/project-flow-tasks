import prisma from '@/lib/prisma'
import type { CreateTimeEntryInput, TimeEntryFilter } from '@/types/time-entry'

export async function createTimeEntry(
  organizationId: string, 
  userId: string, 
  data: CreateTimeEntryInput
) {
  const task = await prisma.task.findFirst({
    where: { id: data.taskId, organizationId },
    include: { assignedTo: true },
  })

  if (!task) throw new Error('Task not found')

  const user = await prisma.user.findFirst({
    where: { id: userId, organizationId },
  })

  if (!user) throw new Error('User not found')

  const cost = (user.hourlyCost || 0) * (data.minutes / 60)

  return prisma.timeEntry.create({
    data: {
      organizationId,
      taskId: data.taskId,
      userId,
      projectId: task.projectId,
      minutes: data.minutes,
      costSnapshot: cost,
      description: data.description,
    },
    include: {
      task: { select: { id: true, title: true } },
      user: { select: { id: true, name: true } },
    },
  })
}

export async function getTimeEntryById(organizationId: string, entryId: string) {
  return prisma.timeEntry.findFirst({
    where: { id: entryId, organizationId },
    include: {
      task: true,
      user: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } },
    },
  })
}

export async function listTimeEntries(organizationId: string, filter?: TimeEntryFilter) {
  const where: any = { organizationId }

  if (filter?.taskId) where.taskId = filter.taskId
  if (filter?.projectId) where.projectId = filter.projectId
  if (filter?.userId) where.userId = filter.userId
  if (filter?.startDate || filter?.endDate) {
    where.createdAt = {}
    if (filter.startDate) where.createdAt.gte = new Date(filter.startDate)
    if (filter.endDate) where.createdAt.lte = new Date(filter.endDate)
  }

  return prisma.timeEntry.findMany({
    where,
    include: {
      task: { select: { id: true, title: true } },
      user: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function deleteTimeEntry(organizationId: string, entryId: string) {
  return prisma.timeEntry.delete({
    where: { id: entryId },
  })
}

export async function getUserTimeStats(organizationId: string, userId: string, startDate?: Date, endDate?: Date) {
  const where: any = { userId, organizationId }
  
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = startDate
    if (endDate) where.createdAt.lte = endDate
  }

  const aggregation = await prisma.timeEntry.aggregate({
    where,
    _sum: { minutes: true, costSnapshot: true },
    _count: true,
  })

  return {
    totalHours: (aggregation._sum.minutes || 0) / 60,
    totalCost: Number(aggregation._sum.costSnapshot || 0),
    entriesCount: aggregation._count,
  }
}

export async function getOrganizationDashboard(organizationId: string) {
  const [
    projectCount,
    taskCount,
    activeProjects,
    timeAggregation,
    tasksByStatus,
  ] = await Promise.all([
    prisma.project.count({ where: { organizationId, status: 'ACTIVE' } }),
    prisma.task.count({ where: { organizationId } }),
    prisma.project.findMany({
      where: { organizationId, status: 'ACTIVE' },
      select: { id: true, name: true },
      take: 5,
    }),
    prisma.timeEntry.aggregate({
      where: { organizationId },
      _sum: { minutes: true, costSnapshot: true },
    }),
    prisma.task.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: true,
    }),
  ])

  return {
    totalProjects: projectCount,
    totalTasks: taskCount,
    activeProjects,
    totalHours: (timeAggregation._sum.minutes || 0) / 60,
    totalCost: Number(timeAggregation._sum.costSnapshot || 0),
    tasksByStatus: tasksByStatus.reduce((acc, t) => {
      acc[t.status] = t._count
      return acc
    }, {} as Record<string, number>),
  }
}