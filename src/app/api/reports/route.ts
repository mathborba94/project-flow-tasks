import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type')

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
      const tasks = await prisma.task.findMany({
        where: {
          organizationId,
          dueDate: { lt: now },
          status: { notIn: ['DONE', 'CANCELLED'] },
        },
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
      const projects = await prisma.project.findMany({
        where: { organizationId, archived: false },
        include: {
          owner: { select: { id: true, name: true } },
          _count: { select: { tasks: true } },
        },
        orderBy: { name: 'asc' },
      })

      const projectIds = projects.map(p => p.id)
      const timeEntries = await prisma.timeEntry.groupBy({
        by: ['projectId'],
        where: { projectId: { in: projectIds }, organizationId },
        _sum: { minutes: true, costSnapshot: true },
      })

      const timeMap = new Map(timeEntries.map(t => [t.projectId, t._sum as { minutes: number | null; costSnapshot: number | null } | null]))

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
        const totalMinutes = timeMap.get(p.id)?.minutes || 0
        const totalCost = Number(timeMap.get(p.id)?.costSnapshot || 0)

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
