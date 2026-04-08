import { NextResponse } from 'next/server'
import { createClientServer } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createClientServer()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ user: null }, { status: 500 })
  }
}
