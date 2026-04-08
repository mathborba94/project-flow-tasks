import { NextResponse } from 'next/server'
import { getInvitationByToken } from '@/services/organization'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const invitation = await getInvitationByToken(token)

    if (!invitation) {
      return NextResponse.json({ error: 'Convite não encontrado' }, { status: 404 })
    }

    if (invitation.acceptedAt) {
      return NextResponse.json({ error: 'Convite já foi aceito' }, { status: 410 })
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Convite expirado' }, { status: 410 })
    }

    return NextResponse.json({
      email: invitation.email,
      role: invitation.role,
      orgName: invitation.organization.name,
      expiresAt: invitation.expiresAt,
    })
  } catch {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
