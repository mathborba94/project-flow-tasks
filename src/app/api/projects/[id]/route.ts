import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import * as projectService from '@/services/project'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()
    const { id } = await params
    const project = await projectService.getProjectById(organizationId, id)
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()
    const { id } = await params
    
    const body = await request.json()
    const project = await projectService.updateProject(organizationId, id, body)
    return NextResponse.json(project)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()
    const { id } = await params

    await projectService.deleteProject(organizationId, id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()
    const { id } = await params
    const body = await request.json()
    const { action } = body

    if (action === 'archive') {
      const project = await projectService.archiveProject(organizationId, id, true)
      return NextResponse.json(project)
    }
    if (action === 'unarchive') {
      const project = await projectService.archiveProject(organizationId, id, false)
      return NextResponse.json(project)
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}