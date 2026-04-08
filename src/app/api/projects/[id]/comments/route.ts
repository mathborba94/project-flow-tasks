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

    const project = await prisma.project.findUnique({
      where: { id, organizationId },
    })
    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
    }

    const comments = await prisma.projectComment.findMany({
      where: { projectId: id },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
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

    const project = await prisma.project.findUnique({
      where: { id, organizationId },
    })
    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const { content } = body

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Conteúdo é obrigatório' },
        { status: 400 }
      )
    }

    const comment = await prisma.projectComment.create({
      data: {
        projectId: id,
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
