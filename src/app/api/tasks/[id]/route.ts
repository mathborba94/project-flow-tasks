import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import * as taskService from '@/services/task'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()
    const { id } = await params
    
    const task = await taskService.getTaskById(organizationId, id)
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    return NextResponse.json(task)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId, user } = await getCurrentUserWithOrg()
    const { id } = await params

    // Check task exists and enforce permissions
    const existingTask = await taskService.getTaskById(organizationId, id)
    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // MEMBER/VIEWER can only update tasks assigned to them
    if ((user.role === 'MEMBER' || user.role === 'VIEWER') && existingTask.assignedToId !== user.id) {
      return NextResponse.json({ error: 'Sem permissão para editar esta tarefa' }, { status: 403 })
    }

    // VIEWER cannot update tasks at all
    if (user.role === 'VIEWER') {
      return NextResponse.json({ error: 'Sem permissão para editar tarefas' }, { status: 403 })
    }

    const body = await request.json()
    const task = await taskService.updateTask(organizationId, id, body, user.id)
    return NextResponse.json(task)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId, user } = await getCurrentUserWithOrg()
    const { id } = await params

    // Only OWNER/ADMIN can delete tasks
    if (user.role === 'MEMBER' || user.role === 'VIEWER') {
      return NextResponse.json({ error: 'Sem permissão para excluir tarefas' }, { status: 403 })
    }

    await taskService.deleteTask(organizationId, id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}