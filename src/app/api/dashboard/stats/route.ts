import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()

    // Parse reference month from URL
    const searchParams = request.nextUrl.searchParams
    const monthParam = searchParams.get('month')

    let monthStart: Date
    let monthEnd: Date

    if (monthParam) {
      const [year, monthNum] = monthParam.split('-').map(Number)
      monthStart = new Date(year, monthNum - 1, 1)
      monthEnd = new Date(year, monthNum, 0, 23, 59, 59)
    } else {
      // Default: last 14 days
      monthEnd = new Date()
      monthStart = new Date()
      monthStart.setDate(monthStart.getDate() - 14)
    }

    // Horas por dia no período
    const timeByDay = await prisma.$queryRaw`
      SELECT
        DATE("createdAt") as day,
        SUM(minutes) as total_minutes
      FROM "TimeEntry"
      WHERE "organizationId" = ${organizationId}
        AND "createdAt" >= ${monthStart}
        AND "createdAt" <= ${monthEnd}
      GROUP BY DATE("createdAt")
      ORDER BY day ASC
    ` as Array<{ day: Date; total_minutes: bigint }>

    // Tarefas abertas vs encerradas por dia no período
    const tasksByDay = await prisma.$queryRaw`
      SELECT
        DATE("createdAt") as day,
        COUNT(*) FILTER (WHERE status != 'DONE' AND status != 'CANCELLED') as opened,
        COUNT(*) FILTER (WHERE status = 'DONE') as closed
      FROM "Task"
      WHERE "organizationId" = ${organizationId}
        AND "createdAt" >= ${monthStart}
        AND "createdAt" <= ${monthEnd}
      GROUP BY DATE("createdAt")
      ORDER BY day ASC
    ` as Array<{ day: Date; opened: bigint; closed: bigint }>

    // Média de produção por semana (últimas 4 semanas do período)
    const fourWeeksAgo = new Date(monthStart)
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

    const weeklyAvg = await prisma.$queryRaw`
      SELECT
        DATE_TRUNC('week', "createdAt") as week,
        COUNT(*) FILTER (WHERE status = 'DONE') as completed
      FROM "Task"
      WHERE "organizationId" = ${organizationId}
        AND "createdAt" >= ${fourWeeksAgo}
        AND "createdAt" <= ${monthEnd}
      GROUP BY DATE_TRUNC('week', "createdAt")
      ORDER BY week ASC
    ` as Array<{ week: Date; completed: bigint }>

    const weeklyAverage = weeklyAvg.length > 0
      ? Math.round(Number(weeklyAvg.reduce((sum, w) => sum + BigInt(w.completed), BigInt(0))) / weeklyAvg.length * 10) / 10
      : 0

    return NextResponse.json({
      hoursByDay: (timeByDay as Array<{ day: Date; total_minutes: bigint }>).map(d => ({
        day: d.day.toISOString().split('T')[0],
        hours: Math.round(Number(d.total_minutes) / 60 * 10) / 10,
      })),
      tasksByDay: (tasksByDay as Array<{ day: Date; opened: bigint; closed: bigint }>).map(d => ({
        day: d.day.toISOString().split('T')[0],
        opened: Number(d.opened),
        closed: Number(d.closed),
      })),
      weeklyAverage,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
