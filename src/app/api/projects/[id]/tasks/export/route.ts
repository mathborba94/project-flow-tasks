import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()
    const { id } = await params

    const project = await prisma.project.findFirst({
      where: { id, organizationId },
    })
    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
    }

    const tasks = await prisma.task.findMany({
      where: { projectId: id, organizationId },
      include: {
        assignedTo: { select: { email: true } },
        taskType: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const headers = ['Title', 'Description', 'Status', 'Priority', 'AssigneeEmail', 'TaskType', 'DueDate']
    const rows = tasks.map(t => [
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      t.assignedTo?.email || '',
      t.taskType?.name || '',
      t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '',
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const buffer = Buffer.from(await blob.arrayBuffer())

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="tasks_${project.name.replace(/\s+/g, '_')}.csv"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
