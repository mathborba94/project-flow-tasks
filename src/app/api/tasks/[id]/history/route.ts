import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import prisma from '@/lib/prisma'
import * as taskHistoryService from '@/services/task-history'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()
    const { id } = await params

    // Verify task belongs to org
    const task = await prisma.task.findFirst({
      where: { id, organizationId },
    })
    if (!task) {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })
    }

    const history = await taskHistoryService.getTaskHistory(id)
    return NextResponse.json(history)
  } catch {
    return NextResponse.json(
      { error: 'Erro ao buscar histórico' },
      { status: 500 }
    )
  }
}
