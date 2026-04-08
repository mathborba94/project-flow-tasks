import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import * as projectService from '@/services/project'
import { createProjectSchema, projectFilterSchema } from '@/types/project'

export async function GET(request: NextRequest) {
  try {
    const { organizationId, user } = await getCurrentUserWithOrg()
    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all')

    const filter = projectFilterSchema.safeParse({
      status: searchParams.get('status') || undefined,
      ownerId: searchParams.get('ownerId') || undefined,
      search: searchParams.get('search') || undefined,
    })

    const filterData = filter.success ? filter.data : {}

    // OWNER/ADMIN with all=1: list all projects without membership filtering
    const isAdmin = all === '1' && (user.role === 'OWNER' || user.role === 'ADMIN')

    const projects = isAdmin
      ? await projectService.listProjects(organizationId, filterData)
      : await projectService.listProjects(organizationId, {
          ...filterData,
          userId: user.id,
          userRole: user.role,
        })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
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