import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import PublicProjectClient from './public-project-client'

export const dynamic = 'force-dynamic'

export default async function PublicProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      owner: { select: { id: true, name: true } },
      organization: { select: { name: true, logoUrl: true, logoShape: true } },
      pipeline: {
        include: {
          stages: { orderBy: { order: 'asc' } },
        },
      },
    },
  })

  if (!project || !project.allowPublicTasks) {
    notFound()
  }

  const [tasks, documents, comments] = await Promise.all([
    prisma.task.findMany({
      where: { projectId },
      include: {
        assignedTo: { select: { id: true, name: true } },
        pipelineStage: { select: { id: true, name: true, color: true } },
      },
      orderBy: [{ status: 'asc' }, { priority: 'desc' }, { dueDate: 'asc' }],
    }),
    prisma.projectDocument.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, fileUrl: true, type: true, createdAt: true },
    }),
    prisma.projectComment.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, name: true } },
      },
    }),
  ])

  const totalTasks = tasks.length
  const doneTasks = tasks.filter(t => t.status === 'DONE').length
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
  const overdueTasks = tasks.filter(
    t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE' && t.status !== 'CANCELLED'
  ).length

  return (
    <PublicProjectClient
      project={{
        id: project.id,
        name: project.name,
        description: project.description,
        color: project.color,
        status: project.status,
        type: project.type,
        startDate: project.startDate?.toISOString() ?? null,
        endDate: project.endDate?.toISOString() ?? null,
        targetEndDate: project.targetEndDate?.toISOString() ?? null,
        budget: project.budget ? Number(project.budget) : null,
        owner: project.owner,
        organization: project.organization,
        pipeline: project.pipeline ? {
          stages: project.pipeline.stages.map(s => ({
            id: s.id,
            name: s.name,
            color: s.color,
            order: s.order,
          })),
        } : null,
      }}
      stats={{ totalTasks, doneTasks, inProgressTasks, progress, overdueTasks }}
      tasks={tasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate?.toISOString() ?? null,
        createdAt: t.createdAt.toISOString(),
        completedAt: t.completedAt?.toISOString() ?? null,
        assignedTo: t.assignedTo,
        pipelineStageId: t.pipelineStageId,
        stageName: t.pipelineStage?.name,
      }))}
      documents={documents.map(d => ({
        id: d.id,
        title: d.name,
        fileUrl: d.fileUrl,
        fileType: d.type,
        createdAt: d.createdAt.toISOString(),
      }))}
      comments={comments.map(c => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        author: c.author,
      }))}
    />
  )
}
