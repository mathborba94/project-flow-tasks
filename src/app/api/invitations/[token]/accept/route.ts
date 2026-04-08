import { NextResponse } from 'next/server'
import { createClientServer } from '@/lib/supabase-server'
import { acceptInvitation } from '@/services/organization'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const supabase = await createClientServer()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { token } = await params
    const invitation = await acceptInvitation(token, user.id)

    return NextResponse.json({
      success: true,
      organizationId: invitation.organizationId,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
