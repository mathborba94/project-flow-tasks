import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const createPipelineSchema = z.object({
  projectId: z.string().cuid(),
  template: z.enum(['AGILE', 'WATERFALL', 'SIMPLE']),
  name: z.string().min(1).max(200).optional(),
})

const stageTemplates: Record<string, { name: string; color: string }[]> = {
  AGILE: [
    { name: 'Backlog', color: '#6B7280' },
    { name: 'A Fazer', color: '#8B5CF6' },
    { name: 'Em Progresso', color: '#3B82F6' },
    { name: 'Em Revisao', color: '#F59E0B' },
    { name: 'Concluido', color: '#10B981' },
  ],
  WATERFALL: [
    { name: 'Planejamento', color: '#6B7280' },
    { name: 'Execucao', color: '#8B5CF6' },
    { name: 'Teste', color: '#3B82F6' },
    { name: 'Implantacao', color: '#F59E0B' },
    { name: 'Concluido', color: '#10B981' },
  ],
  SIMPLE: [
    { name: 'A Fazer', color: '#8B5CF6' },
    { name: 'Fazendo', color: '#3B82F6' },
    { name: 'Concluido', color: '#10B981' },
  ],
}

export async function POST(request: NextRequest) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()
    const body = await request.json()
    const { projectId, template, name } = createPipelineSchema.parse(body)

    // Verify project belongs to organization and check if it already has a pipeline
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId },
      include: { pipeline: true },
    })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.pipeline) {
      return NextResponse.json({ error: 'Project already has a pipeline' }, { status: 409 })
    }

    const stages = stageTemplates[template]
    const pipelineName = name || `${template.charAt(0).toUpperCase() + template.slice(1).toLowerCase()} Pipeline`

    const pipeline = await prisma.$transaction(async (tx) => {
      const createdPipeline = await tx.pipeline.create({
        data: {
          projectId,
          name: pipelineName,
          isDefault: true,
        },
      })

      await tx.pipelineStage.createMany({
        data: stages.map((stage, index) => ({
          pipelineId: createdPipeline.id,
          name: stage.name,
          order: index,
          color: stage.color,
        })),
      })

      return tx.pipeline.findUnique({
        where: { id: createdPipeline.id },
        include: { stages: { orderBy: { order: 'asc' } } },
      })
    })

    return NextResponse.json(pipeline, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (projectId) {
      // Verify project belongs to organization
      const project = await prisma.project.findFirst({
        where: { id: projectId, organizationId },
      })
      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }

      const pipeline = await prisma.pipeline.findUnique({
        where: { projectId },
        include: { stages: { orderBy: { order: 'asc' } } },
      })
      return NextResponse.json(pipeline)
    }

    // Fallback: return org-level pipelines
    const pipelines = await prisma.pipeline.findMany({
      where: { organizationId },
      include: { stages: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(pipelines)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
