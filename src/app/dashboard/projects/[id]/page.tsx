import { notFound } from 'next/navigation'
import { getCurrentUserWithOrg } from '@/services/auth'
import { getProjectById } from '@/services/project'
import { listTasks } from '@/services/task'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import KanbanBoard from '@/components/project/kanban'
import { ArrowLeft, Archive, RotateCcw } from 'lucide-react'
import ProjectActions from '@/components/project/actions'
import ProjectDetailClient from '@/components/project/detail-client'

const statusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Ativo', className: 'bg-emerald-500/10 text-emerald-400' },
  PAUSED: { label: 'Pausado', className: 'bg-amber-500/10 text-amber-400' },
  COMPLETED: { label: 'Concluído', className: 'bg-zinc-800 text-zinc-400' },
}

const typeLabels: Record<string, string> = {
  SCOPE_FIXED: 'Escopo Fechado',
  CONTINUOUS: 'Contínuo',
}

export default async function ProjectDetailPage({ 
  params,
  searchParams,
}: { 
  params: Promise<{ id: string }>
  searchParams: Promise<{ view?: string }>
}) {
  const { id } = await params
  const { view } = await searchParams

  let organizationId = 'demo-org'
  let userRole = 'ADMIN'
  try {
    const { organizationId: orgId, user } = await getCurrentUserWithOrg()
    organizationId = orgId
    userRole = user.role
  } catch {}

  const [project, tasks, taskTypes, org] = await Promise.all([
    getProjectById(organizationId, id),
    listTasks(organizationId, { projectId: id }),
    prisma.taskType.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    }),
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { defaultTaskTypeId: true },
    }),
  ])

  if (!project) {
    notFound()
  }

  // Extract project members (only people who are members of this project)
  const orgMembers = project.members.map((m: any) => ({ id: m.user.id, name: m.user.name }))

  // Get pipeline stages - use project's own pipeline
  const pipeline = await prisma.pipeline.findUnique({
    where: { projectId: id },
    include: {
      stages: {
        orderBy: { order: 'asc' },
      },
    },
  })

  const status = statusConfig[project.status] || statusConfig.ACTIVE
  const completedTasks = tasks.filter((t: { status: string }) => t.status === 'DONE').length
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0

  const taskIds = tasks.map((t: { id: string }) => t.id)

  // Compute stageEnteredAt: last STAGE_CHANGED event per task
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [stageHistories, todayTimeEntries] = await Promise.all([
    taskIds.length > 0
      ? prisma.taskHistory.findMany({
          where: {
            taskId: { in: taskIds },
            eventType: 'STAGE_CHANGED',
          },
          select: { taskId: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        })
      : [],
    taskIds.length > 0
      ? prisma.timeEntry.groupBy({
          by: ['taskId'],
          where: {
            taskId: { in: taskIds },
            createdAt: { gte: todayStart },
          },
          _sum: { minutes: true },
        })
      : [],
  ])

  // Build maps for O(1) lookups
  const stageEnteredMap = new Map<string, string>()
  for (const h of stageHistories) {
    if (!stageEnteredMap.has(h.taskId)) {
      stageEnteredMap.set(h.taskId, h.createdAt.toISOString())
    }
  }
  const todayMinutesMap = new Map<string, number>(todayTimeEntries.map(e => [e.taskId, e._sum.minutes || 0] as const))

  // Serialize for client components
  const serializedTasks = tasks.map((t: { id: string; title: string; description: string | null; status: string; priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'; assignedToId: string | null; pipelineStageId: string | null; assignedTo: { id: string; name: string } | null; _count?: { timeEntries: number }; createdAt: Date; dueDate?: Date | null }) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    assignedTo: t.assignedTo,
    _timeEntries: [],
    _timeEntriesCount: t._count?.timeEntries || 0,
    stageEnteredAt: stageEnteredMap.get(t.id) || t.createdAt.toISOString(),
    todayMinutes: todayMinutesMap.get(t.id) || 0,
  }))

  const serializedStages = pipeline?.stages.map(s => ({
    id: s.id,
    name: s.name,
    order: s.order,
    color: s.color,
    pipelineId: s.pipelineId,
  })) || []

  return (
    <ProjectDetailClient
      projectId={id}
      projectData={project}
      status={status}
      typeLabels={typeLabels}
      progress={progress}
      serializedTasks={serializedTasks}
      serializedStages={serializedStages}
      orgMembers={orgMembers}
      showSettings={view === 'settings'}
      showProgress={project.type === 'SCOPE_FIXED'}
      canEdit={userRole === 'OWNER' || userRole === 'ADMIN'}
      isViewer={userRole === 'VIEWER'}
      taskTypes={taskTypes.map(tt => ({
        id: tt.id,
        name: tt.name,
        slaMinutes: tt.slaMinutes,
      }))}
      defaultTaskTypeId={org?.defaultTaskTypeId}
    />
  )
}
