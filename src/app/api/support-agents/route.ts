import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const { organizationId } = await getCurrentUserWithOrg()

    const agents = await prisma.supportAgent.findMany({
      where: { organizationId },
      include: {
        project: { select: { id: true, name: true, color: true } },
        _count: { select: { sessions: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(agents)
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()
    const body = await request.json()

    const agent = await prisma.supportAgent.create({
      data: {
        organizationId,
        name: body.name || 'Agente de Suporte',
        personality: body.personality || null,
        voiceTone: body.voiceTone || null,
        conductPrompt: body.conductPrompt || null,
        projectId: body.projectId || null,
        active: body.active ?? true,
        showOnPublicKB: body.showOnPublicKB ?? false,
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
      },
    })

    return NextResponse.json(agent, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar agente' }, { status: 500 })
  }
}
