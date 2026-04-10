import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type')

    if (reportType === 'summary') {
      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')

      const timeWhere: any = { organizationId }
      if (startDate || endDate) {
        timeWhere.createdAt = {}
        if (startDate) timeWhere.createdAt.gte = new Date(startDate)
        if (endDate) timeWhere.createdAt.lte = new Date(endDate + 'T23:59:59')
      }

      const taskWhere: any = { organizationId }
      if (startDate || endDate) {
        taskWhere.createdAt = {}
        if (startDate) taskWhere.createdAt.gte = new Date(startDate)
        if (endDate) taskWhere.createdAt.lte = new Date(endDate + 'T23:59:59')
      }

      const [projects, tasks, timeStats, taskTypeStats] = await Promise.all([
        prisma.project.findMany({
          where: { organizationId, archived: false },
          select: {
            id: true, name: true, color: true, status: true, type: true,
            _count: { select: { tasks: true } },
          },
          orderBy: { name: 'asc' },
        }),
        prisma.task.findMany({
          where: taskWhere,
          select: { id: true, status: true, priority: true },
        }),
        prisma.timeEntry.groupBy({
          by: ['projectId'],
          where: timeWhere,
          _sum: { minutes: true, costSnapshot: true },
        }),
        prisma.timeEntry.groupBy({
          by: ['taskId'],
          where: timeWhere,
          _sum: { minutes: true, costSnapshot: true },
          _count: true,
        }),
      ])

      const totalMinutes = timeStats.reduce((s, t) => s + (t._sum.minutes || 0), 0)
      const totalCost = timeStats.reduce((s, t) => s + Number(t._sum.costSnapshot || 0), 0)

      const timeByProject = new Map(timeStats.map(t => [t.projectId, t._sum]))
      const projectsWithStats = projects.map(p => ({
        ...p,
        totalHours: (timeByProject.get(p.id)?.minutes || 0) / 60,
        totalCost: Number(timeByProject.get(p.id)?.costSnapshot || 0),
      }))

      const tasksByStatus = tasks.reduce((acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const tasksByPriority = tasks.reduce((acc, t) => {
        acc[t.priority] = (acc[t.priority] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return NextResponse.json({
        projects: projectsWithStats,
        tasks,
        tasksByStatus,
        tasksByPriority,
        totalHours: totalMinutes / 60,
        totalCost,
        completionRate: tasks.length > 0
          ? Math.round((tasks.filter(t => t.status === 'DONE').length / tasks.length) * 100)
          : 0,
      })
    }

    if (reportType === 'hours-consumption') {
      const projectId = searchParams.get('projectId')
      const userId = searchParams.get('userId')
      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')

      const where: any = { organizationId }
      if (projectId) where.projectId = projectId
      if (userId) where.userId = userId
      if (startDate || endDate) {
        where.createdAt = {}
        if (startDate) where.createdAt.gte = new Date(startDate)
        if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59')
      }

      const entries = await prisma.timeEntry.findMany({
        where,
        include: {
          task: { select: { id: true, title: true } },
          user: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({ entries })
    }

    if (reportType === 'user-allocation') {
      const month = searchParams.get('month') || new Date().toISOString().slice(0, 7)
      const [year, mon] = month.split('-').map(Number)
      const startDate = new Date(year, mon - 1, 1)
      const endDate = new Date(year, mon, 0, 23, 59, 59, 999)

      const users = await prisma.user.findMany({
        where: { organizationId, isActive: true },
        select: { id: true, name: true, email: true, hourlyCost: true },
        orderBy: { name: 'asc' },
      })

      const allocation = await prisma.timeEntry.groupBy({
        by: ['userId'],
        where: {
          organizationId,
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { minutes: true, costSnapshot: true },
        _count: true,
      })

      const inProgress = await prisma.task.findMany({
        where: {
          organizationId,
          assignedToId: { in: users.map(u => u.id) },
          status: { in: ['TODO', 'IN_PROGRESS', 'IN_REVIEW'] },
        },
        select: {
          id: true,
          title: true,
          assignedToId: true,
          status: true,
          project: { select: { id: true, name: true } },
        },
      })

      return NextResponse.json({ users, allocation, inProgress })
    }

    if (reportType === 'overdue-tasks') {
      const now = new Date()
      const projectId = searchParams.get('projectId')
      const assigneeId = searchParams.get('assigneeId')
      const dueDateFrom = searchParams.get('dueDateFrom')
      const dueDateTo = searchParams.get('dueDateTo')

      const where: any = {
        organizationId,
        status: { notIn: ['DONE', 'CANCELLED'] },
      }
      if (projectId) where.projectId = projectId
      if (assigneeId) where.assignedToId = assigneeId

      if (dueDateFrom || dueDateTo) {
        where.dueDate = {}
        if (dueDateFrom) where.dueDate.gte = new Date(dueDateFrom)
        if (dueDateTo) where.dueDate.lte = new Date(dueDateTo + 'T23:59:59')
      } else {
        where.dueDate = { lt: now }
      }

      const tasks = await prisma.task.findMany({
        where,
        include: {
          assignedTo: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
          taskType: { select: { id: true, name: true } },
        },
        orderBy: { dueDate: 'asc' },
      })
      return NextResponse.json({ tasks })
    }

    if (reportType === 'project-health') {
      const statusFilter = searchParams.get('status')
      const typeFilter = searchParams.get('type')
      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')

      const projectWhere: any = { organizationId, archived: false }
      if (statusFilter) projectWhere.status = statusFilter
      if (typeFilter) projectWhere.type = typeFilter
      if (startDate || endDate) {
        projectWhere.createdAt = {}
        if (startDate) projectWhere.createdAt.gte = new Date(startDate)
        if (endDate) projectWhere.createdAt.lte = new Date(endDate + 'T23:59:59')
      }

      const projects = await prisma.project.findMany({
        where: projectWhere,
        include: {
          owner: { select: { id: true, name: true } },
          _count: { select: { tasks: true } },
        },
        orderBy: { name: 'asc' },
      })

      const projectIds = projects.map(p => p.id)

      const timeWhere: any = { projectId: { in: projectIds }, organizationId }
      if (startDate || endDate) {
        timeWhere.createdAt = {}
        if (startDate) timeWhere.createdAt.gte = new Date(startDate)
        if (endDate) timeWhere.createdAt.lte = new Date(endDate + 'T23:59:59')
      }

      const timeEntries = await prisma.timeEntry.groupBy({
        by: ['projectId'],
        where: timeWhere,
        _sum: { minutes: true, costSnapshot: true },
      })

      type TimeSum = { minutes: number | null; costSnapshot: unknown } | null
      const timeMap = new Map<string, TimeSum>(timeEntries.map(t => [t.projectId, t._sum as TimeSum]))

      const overdueTasks = await prisma.task.groupBy({
        by: ['projectId'],
        where: {
          organizationId,
          projectId: { in: projectIds },
          dueDate: { lt: new Date() },
          status: { notIn: ['DONE', 'CANCELLED'] },
        },
        _count: true,
      })

      const overdueMap = new Map(overdueTasks.map(o => [o.projectId, o._count]))

      const statusAgg = await prisma.task.groupBy({
        by: ['projectId', 'status'],
        where: { projectId: { in: projectIds }, organizationId },
        _count: true,
      })

      const projectStats = projects.map(p => {
        const totalTasks = p._count.tasks
        const doneTasks = statusAgg.filter(s => s.projectId === p.id && s.status === 'DONE').reduce((a, s) => a + s._count, 0)
        const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
        const timeSum = timeMap.get(p.id)
        const totalMinutes = timeSum?.minutes || 0
        const totalCost = Number(timeSum?.costSnapshot || 0)

        return {
          ...p,
          progress,
          totalHours: totalMinutes / 60,
          totalCost,
          overdueTasks: overdueMap.get(p.id) || 0,
        }
      })

      return NextResponse.json({ projects: projectStats })
    }

    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
