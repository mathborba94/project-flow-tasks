import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import * as projectService from '@/services/project'
import { createProjectSchema, projectFilterSchema } from '@/types/project'

export async function GET(request: NextRequest) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()
    const { searchParams } = new URL(request.url)
    
    const filter = projectFilterSchema.parse({
      status: searchParams.get('status'),
      ownerId: searchParams.get('ownerId'),
      search: searchParams.get('search'),
    })

    const projects = await projectService.listProjects(organizationId, filter)
    return NextResponse.json(projects)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { organizationId, user } = await getCurrentUserWithOrg()
    
    const body = await request.json()
    const data = createProjectSchema.parse({
      ...body,
      ownerId: body.ownerId || user.id,
    })

    const project = await projectService.createProject(organizationId, data)
    return NextResponse.json(project, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}