import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import * as taskService from '@/services/task'
import { createTaskSchema, taskFilterSchema, moveTaskSchema } from '@/types/task'

export async function GET(request: NextRequest) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()
    const { searchParams } = new URL(request.url)
    
    const filter = taskFilterSchema.parse({
      status: searchParams.get('status'),
      priority: searchParams.get('priority'),
      projectId: searchParams.get('projectId'),
      assignedToId: searchParams.get('assignedToId'),
      search: searchParams.get('search'),
    })

    const tasks = await taskService.listTasks(organizationId, filter)
    return NextResponse.json(tasks)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()
    const body = await request.json()
    const data = createTaskSchema.parse(body)

    const task = await taskService.createTask(organizationId, data)
    return NextResponse.json(task, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}