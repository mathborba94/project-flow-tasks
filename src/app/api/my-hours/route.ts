import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { organizationId, user } = await getCurrentUserWithOrg()
    const { searchParams } = new URL(request.url)

    const month = searchParams.get('month')
    const projectId = searchParams.get('projectId')

    if (!month) {
      return NextResponse.json({ error: 'Month is required' }, { status: 400 })
    }

    const [year, mon] = month.split('-').map(Number)
    const startDate = new Date(year, mon - 1, 1)
    const endDate = new Date(year, mon, 0, 23, 59, 59, 999)

    const where: any = {
      userId: user.id,
      organizationId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    }

    if (projectId) {
      where.projectId = projectId
    }

    const entries = await prisma.timeEntry.findMany({
      where,
      include: {
        task: { select: { id: true, title: true } },
        project: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ entries })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
