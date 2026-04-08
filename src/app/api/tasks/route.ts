import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import * as taskService from '@/services/task'
import { createTaskSchema, taskFilterSchema, moveTaskSchema } from '@/types/task'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { organizationId, user } = await getCurrentUserWithOrg()
    const { searchParams } = new URL(request.url)

    const filter = taskFilterSchema.parse({
      status: searchParams.get('status'),
      priority: searchParams.get('priority'),
      projectId: searchParams.get('projectId'),
      assignedToId: searchParams.get('assignedToId'),
      search: searchParams.get('search'),
    })

    // Permissões: MEMBER/VIEWER só vê suas próprias tasks
    if (user.role === 'MEMBER' || user.role === 'VIEWER') {
      filter.assignedToId = user.id
    }

    const tasks = await taskService.listTasks(organizationId, filter)
    return NextResponse.json(tasks)
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { organizationId, user } = await getCurrentUserWithOrg()

    // VIEWER cannot create tasks
    if (user.role === 'VIEWER') {
      return NextResponse.json({ error: 'Sem permissão para criar tarefas' }, { status: 403 })
    }

    // MEMBER can only create tasks assigned to themselves
    const body = await request.json()
    if (user.role === 'MEMBER' && body.assignedToId && body.assignedToId !== user.id) {
      return NextResponse.json({ error: 'Membros só podem criar tarefas para si mesmos' }, { status: 403 })
    }

    const data = createTaskSchema.parse(body)

    // Check if pipelineStageId is a completion stage
    if (data.pipelineStageId) {
      const project = await prisma.project.findUnique({
        where: { id: data.projectId, organizationId },
        select: { completionStageId: true },
      })
      if (project?.completionStageId === data.pipelineStageId) {
        return NextResponse.json(
          { error: 'Não é possível criar tarefas na etapa de conclusão' },
          { status: 400 }
        )
      }
    }

    const task = await taskService.createTask(organizationId, data, user.id)
    return NextResponse.json(task, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}