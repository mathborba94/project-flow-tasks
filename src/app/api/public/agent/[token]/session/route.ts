import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const body = await request.json().catch(() => ({}))

    const agent = await prisma.supportAgent.findUnique({
      where: { shareToken: token, active: true },
      select: { id: true },
    })

    if (!agent) return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 })

    const session = await prisma.supportSession.create({
      data: {
        agentId: agent.id,
        visitorName: body.visitorName || null,
        visitorEmail: body.visitorEmail || null,
      },
      select: { sessionToken: true },
    })

    return NextResponse.json({ sessionToken: session.sessionToken })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar sessão' }, { status: 500 })
  }
}
