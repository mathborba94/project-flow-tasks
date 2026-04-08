import { NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const { organizationId, user: currentUser } = await getCurrentUserWithOrg()

    const users = await prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        hourlyCost: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(users)
  } catch {
    return NextResponse.json(
      { error: 'Erro ao buscar usuários' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { organizationId, user: currentUser } = await getCurrentUserWithOrg()

    // Buscar usuário alvo
    const targetUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!targetUser || targetUser.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Permissões: só OWNER/ADMIN pode editar outros; qualquer um pode editar a si mesmo
    const canEditOthers = currentUser.role === 'OWNER' || currentUser.role === 'ADMIN'
    if (targetUser.id !== currentUser.id && !canEditOthers) {
      return NextResponse.json(
        { error: 'Sem permissão' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, email, hourlyCost, isActive } = body

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(hourlyCost !== undefined && { hourlyCost: String(hourlyCost) }),
        ...(isActive !== undefined && { isActive }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        hourlyCost: true,
        isActive: true,
      },
    })

    return NextResponse.json(updated)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
