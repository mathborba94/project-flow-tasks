import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
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
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
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

    // Compute stats
    const totalTasks = tasks.length
    const doneTasks = tasks.filter(t => t.status === 'DONE').length
    const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
    const overdueTasks = tasks.filter(
      t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE' && t.status !== 'CANCELLED'
    ).length

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        color: project.color,
        status: project.status,
        type: project.type,
        startDate: project.startDate,
        endDate: project.endDate,
        targetEndDate: project.targetEndDate,
        budget: project.budget,
        owner: project.owner,
        organization: project.organization,
        pipeline: project.pipeline,
      },
      stats: { totalTasks, doneTasks, progress, overdueTasks },
      tasks: tasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        createdAt: t.createdAt,
        completedAt: t.completedAt,
        assignedTo: t.assignedTo,
        pipelineStageId: t.pipelineStageId,
        stageName: t.pipelineStage?.name,
      })),
      documents,
      comments: comments.map(c => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        author: c.author,
      })),
    })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
