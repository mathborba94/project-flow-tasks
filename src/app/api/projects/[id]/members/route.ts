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

    const members = await prisma.projectMember.findMany({
      where: { projectId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(members)
  } catch {
    return NextResponse.json(
      { error: 'Erro ao buscar membros' },
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
    const { organizationId, user: currentUser } = await getCurrentUserWithOrg()

    const project = await prisma.project.findUnique({
      where: { id, organizationId },
    })
    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const { userId, role = 'MEMBER' } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    // Verifica se o usuário existe e pertence à mesma org
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    })
    if (!targetUser || targetUser.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Usuário não encontrado na organização' },
        { status: 404 }
      )
    }

    // Verifica se já é membro
    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId } },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Usuário já é membro do projeto' },
        { status: 409 }
      )
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId: id,
        userId,
        role,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    })

    return NextResponse.json(member, { status: 201 })
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
    const { organizationId, user: currentUser } = await getCurrentUserWithOrg()

    // Só OWNER/ADMIN pode remover
    if (currentUser.role !== 'OWNER' && currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Sem permissão' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId: id, userId } },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Erro ao remover membro' },
      { status: 500 }
    )
  }
}
