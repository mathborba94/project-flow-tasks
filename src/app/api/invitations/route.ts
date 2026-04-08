import { NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import prisma from '@/lib/prisma'
import { randomUUID } from 'crypto'

export async function GET() {
  try {
    const { organizationId } = await getCurrentUserWithOrg()

    const invitations = await prisma.invitation.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(invitations)
  } catch {
    return NextResponse.json(
      { error: 'Erro ao buscar convites' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { user, organizationId } = await getCurrentUserWithOrg()

    // Only admins and owners can invite
    if (user.role !== 'ADMIN' && user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Sem permissão para enviar convites' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, role } = body

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email e role são obrigatórios' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email, organizationId },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Usuário já pertence à organização' },
        { status: 409 }
      )
    }

    // Create invitation
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 48) // 48h expiry

    const invitation = await prisma.invitation.create({
      data: {
        organizationId,
        email,
        role,
        token: randomUUID(),
        expiresAt,
      },
    })

    return NextResponse.json(invitation, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
