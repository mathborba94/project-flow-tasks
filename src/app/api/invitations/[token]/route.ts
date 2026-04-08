import { NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import { revokeInvitation } from '@/services/organization'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { user, organizationId } = await getCurrentUserWithOrg()

    if (user.role !== 'ADMIN' && user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Sem permissão para revogar convites' },
        { status: 403 }
      )
    }

    const { token } = await params
    await revokeInvitation(token, organizationId)

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
