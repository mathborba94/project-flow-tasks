import { NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import prisma from '@/lib/prisma'
import { randomUUID } from 'crypto'
import { sendInvitationEmail } from '@/lib/email'

export async function GET() {
  try {
    const { organizationId } = await getCurrentUserWithOrg()

    const invitations = await prisma.invitation.findMany({
      where: { organizationId, acceptedAt: null },
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

    // Check if user already belongs to org
    const existingUser = await prisma.user.findFirst({
      where: { email, organizationId },
    })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Usuário já pertence à organização' },
        { status: 409 }
      )
    }

    // Upsert invitation (reset token/expiry if re-inviting same email)
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000)
    const token = randomUUID()

    const invitation = await prisma.invitation.upsert({
      where: { organizationId_email: { organizationId, email } },
      update: { token, expiresAt, acceptedAt: null, role },
      create: { organizationId, email, role, token, expiresAt },
    })

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    // Fire-and-forget
    sendInvitationEmail({
      email,
      orgName: org?.name ?? 'ProjectFlow',
      role,
      inviteUrl: `${appUrl}/join/${invitation.token}`,
    })

    return NextResponse.json(invitation, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
