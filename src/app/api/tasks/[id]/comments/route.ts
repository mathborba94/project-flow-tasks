import { NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { organizationId } = await getCurrentUserWithOrg()

    const task = await prisma.task.findFirst({
      where: { id, organizationId },
    })
    if (!task) {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })
    }

    const comments = await prisma.taskComment.findMany({
      where: { taskId: id },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(comments)
  } catch {
    return NextResponse.json(
      { error: 'Erro ao buscar comentários' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { organizationId, user } = await getCurrentUserWithOrg()

    const task = await prisma.task.findFirst({
      where: { id, organizationId },
    })
    if (!task) {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })
    }

    const body = await request.json()
    const { content } = body

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'content é obrigatório' },
        { status: 400 }
      )
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId: id,
        authorId: user.id,
        content: content.trim(),
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { organizationId } = await getCurrentUserWithOrg()

    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get('commentId')

    if (!commentId) {
      return NextResponse.json(
        { error: 'commentId é obrigatório' },
        { status: 400 }
      )
    }

    const comment = await prisma.taskComment.findUnique({
      where: { id: commentId },
      include: { task: true },
    })

    if (!comment || comment.task.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Comentário não encontrado' },
        { status: 404 }
      )
    }

    await prisma.taskComment.delete({ where: { id: commentId } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Erro ao remover comentário' },
      { status: 500 }
    )
  }
}
