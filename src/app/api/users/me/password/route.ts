import { NextRequest, NextResponse } from 'next/server'
import { createClientServer } from '@/lib/supabase-server'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Campos obrigatórios' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Senha deve ter pelo menos 6 caracteres' }, { status: 400 })
    }

    // Supabase doesn't have a direct "verify current password" API for email auth
    // So we sign in with current password first to verify, then update
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    })

    if (signInError) {
      return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 })
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
