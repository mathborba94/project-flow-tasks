import { NextResponse } from 'next/server'
import { createClientServer } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const supabase = await createClientServer()
    await supabase.auth.signOut()
    
    // Clear the custom cookie
    const cookieStore = await cookies()
    cookieStore.set('sb-access-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
      path: '/',
      sameSite: 'lax',
    })
    
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
