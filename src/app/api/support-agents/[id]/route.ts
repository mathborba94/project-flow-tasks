import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import prisma from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()
    const { id } = await params

    const agent = await prisma.supportAgent.findFirst({
      where: { id, organizationId },
      include: {
        project: { select: { id: true, name: true, color: true } },
        sessions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            _count: { select: { messages: true } },
          },
        },
      },
    })

    if (!agent) return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 })
    return NextResponse.json(agent)
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()
    const { id } = await params
    const body = await request.json()

    const agent = await prisma.supportAgent.updateMany({
      where: { id, organizationId },
      data: {
        name: body.name,
        personality: body.personality ?? null,
        voiceTone: body.voiceTone ?? null,
        conductPrompt: body.conductPrompt ?? null,
        projectId: body.projectId || null,
        active: body.active,
        showOnPublicKB: body.showOnPublicKB,
      },
    })

    if (agent.count === 0) return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar agente' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()
    const { id } = await params

    await prisma.supportAgent.deleteMany({ where: { id, organizationId } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao excluir agente' }, { status: 500 })
  }
}
