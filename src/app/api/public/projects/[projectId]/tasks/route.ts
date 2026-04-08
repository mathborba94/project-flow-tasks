import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendTaskCreatedEmail, sendTaskAssignedEmail } from '@/lib/email'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const body = await request.json()
    const { title, description, priority, assignedToId, taskTypeId, requesterName, requesterEmail } = body

    if (!title) {
      return NextResponse.json(
        { error: 'title e obrigatorio' },
        { status: 400 }
      )
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Projeto nao encontrado' },
        { status: 404 }
      )
    }

    // Get first pipeline stage for new tasks - use project's own pipeline
    const pipeline = await prisma.pipeline.findUnique({
      where: { projectId },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          take: 1,
        },
      },
    })

    const firstStage = pipeline?.stages[0]

    // If taskTypeId is provided, verify it belongs to the same org
    if (taskTypeId) {
      const tt = await prisma.taskType.findFirst({
        where: { id: taskTypeId, organizationId: project.organizationId },
      })
      if (!tt) {
        return NextResponse.json(
          { error: 'Tipo de tarefa invalido' },
          { status: 400 }
        )
      }
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        organizationId: project.organizationId,
        projectId,
        title: title.trim(),
        description: description?.trim() || null,
        priority: priority || 'MEDIUM',
        status: 'TODO',
        assignedToId: assignedToId || null,
        taskTypeId: taskTypeId || null,
        pipelineStageId: firstStage?.id || null,
        requesterName: requesterName?.trim() || null,
        requesterEmail: requesterEmail?.trim() || null,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
    })

    // Fire-and-forget emails (don't block the response)
    const orgName = (await prisma.organization.findUnique({
      where: { id: project.organizationId },
      select: { name: true },
    }))?.name ?? project.name

    if (task.requesterEmail) {
      sendTaskCreatedEmail({
        taskId: task.id,
        taskTitle: task.title,
        projectName: task.project?.name ?? project.name,
        orgName,
        priority: task.priority,
        requesterName: task.requesterName,
        requesterEmail: task.requesterEmail,
      })
    }

    if (task.assignedTo?.email) {
      sendTaskAssignedEmail({
        taskId: task.id,
        taskTitle: task.title,
        taskDescription: task.description,
        projectName: task.project?.name ?? project.name,
        orgName,
        priority: task.priority,
        assigneeName: task.assignedTo.name,
        assigneeEmail: task.assignedTo.email,
        requesterName: task.requesterName,
      })
    }

    return NextResponse.json(task, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
