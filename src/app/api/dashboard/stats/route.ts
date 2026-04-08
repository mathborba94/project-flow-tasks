import { NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const { organizationId } = await getCurrentUserWithOrg()

    // Últimos 14 dias de horas
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const timeByDay = await prisma.$queryRaw`
      SELECT
        DATE("createdAt") as day,
        SUM(minutes) as total_minutes
      FROM "TimeEntry"
      WHERE "organizationId" = ${organizationId}
        AND "createdAt" >= ${fourteenDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY day ASC
    ` as Array<{ day: Date; total_minutes: bigint }>

    // Tarefas abertas vs encerradas por dia (últimos 14 dias)
    const tasksByDay = await prisma.$queryRaw`
      SELECT
        DATE("createdAt") as day,
        COUNT(*) FILTER (WHERE status != 'DONE' AND status != 'CANCELLED') as opened,
        COUNT(*) FILTER (WHERE status = 'DONE') as closed
      FROM "Task"
      WHERE "organizationId" = ${organizationId}
        AND "createdAt" >= ${fourteenDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY day ASC
    ` as Array<{ day: Date; opened: bigint; closed: bigint }>

    // Média de produção por semana (últimas 4 semanas)
    const fourWeeksAgo = new Date()
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

    const weeklyAvg = await prisma.$queryRaw`
      SELECT
        DATE_TRUNC('week', "createdAt") as week,
        COUNT(*) FILTER (WHERE status = 'DONE') as completed
      FROM "Task"
      WHERE "organizationId" = ${organizationId}
        AND "createdAt" >= ${fourWeeksAgo}
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
