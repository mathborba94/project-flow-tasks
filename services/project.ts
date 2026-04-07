import prisma from '@/lib/prisma'
import type { CreateProjectInput, UpdateProjectInput, ProjectFilter } from '@/types/project'

export async function createProject(organizationId: string, data: CreateProjectInput) {
  return prisma.project.create({
    data: {
      organizationId,
      name: data.name,
      description: data.description,
      ownerId: data.ownerId,
      status: data.status,
      budget: data.budget,
      hourlyRate: data.hourlyRate,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { tasks: true },
      },
    },
  })
}

export async function getProjectById(organizationId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          assignedTo: { select: { id: true, name: true } },
        },
      },
      documents: true,
    },
  })

  if (!project) return null

  const timeAggregation = await prisma.timeEntry.aggregate({
    where: { projectId, organizationId },
    _sum: { minutes: true, costSnapshot: true },
    _count: true,
  })

  const tasksAggregation = await prisma.task.groupBy({
    by: ['status'],
    where: { projectId, organizationId },
    _count: true,
  })

  const totalTasks = tasksAggregation.reduce((acc, t) => acc + t._count, 0)
  const completedTasks = tasksAggregation.find(t => t.status === 'DONE')?._count || 0
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return {
    ...project,
    totalHours: (timeAggregation._sum.minutes || 0) / 60,
    totalCost: Number(timeAggregation._sum.costSnapshot || 0),
    timeEntriesCount: timeAggregation._count,
    progress,
    tasksByStatus: tasksAggregation,
  }
}

export async function listProjects(organizationId: string, filter?: ProjectFilter) {
  const where: any = { organizationId }

  if (filter?.status) where.status = filter.status
  if (filter?.ownerId) where.ownerId = filter.ownerId
  if (filter?.search) {
    where.OR = [
      { name: { contains: filter.search, mode: 'insensitive' } },
      { description: { contains: filter.search, mode: 'insensitive' } },
    ]
  }

  const projects = await prisma.project.findMany({
    where,
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { tasks: true, timeEntries: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const projectIds = projects.map(p => p.id)
  
  const costAggregation = await prisma.timeEntry.groupBy({
    by: ['projectId'],
    where: { projectId: { in: projectIds }, organizationId },
    _sum: { minutes: true, costSnapshot: true },
  })

  const costMap = new Map(costAggregation.map(c => [c.projectId, c._sum]))

  return projects.map(p => ({
    ...p,
    totalHours: (costMap.get(p.id)?.minutes || 0) / 60,
    totalCost: Number(costMap.get(p.id)?.costSnapshot || 0),
  }))
}

export async function updateProject(organizationId: string, projectId: string, data: UpdateProjectInput) {
  return prisma.project.update({
    where: { id: projectId },
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
  })
}

export async function deleteProject(organizationId: string, projectId: string) {
  return prisma.project.delete({
    where: { id: projectId },
  })
}

export async function getProjectSummary(organizationId: string, projectId: string) {
  const project = await getProjectById(organizationId, projectId)
  if (!project) return null

  const operatorStats = await prisma.timeEntry.groupBy({
    by: ['userId'],
    where: { projectId, organizationId },
    _sum: { minutes: true, costSnapshot: true },
    _count: true,
  })

  const userIds = operatorStats.map(s => s.userId)
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  })

  const userMap = new Map(users.map(u => [u.id, u.name]))

  return {
    ...project,
    operators: operatorStats.map(s => ({
      userId: s.userId,
      name: userMap.get(s.userId) || 'Unknown',
      hours: (s._sum.minutes || 0) / 60,
      cost: Number(s._sum.costSnapshot || 0),
      entriesCount: s._count,
    })),
  }
}