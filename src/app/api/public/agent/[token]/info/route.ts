import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const agent = await prisma.supportAgent.findUnique({
    where: { shareToken: token, active: true },
    select: {
      id: true,
      name: true,
      personality: true,
      voiceTone: true,
      organization: { select: { name: true, logoUrl: true, slug: true } },
      project: { select: { id: true, name: true, color: true } },
    },
  })

  if (!agent) return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 })
  return NextResponse.json(agent)
}
