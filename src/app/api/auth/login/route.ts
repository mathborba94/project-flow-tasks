import { NextResponse } from 'next/server'
import { createClientServer } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await createClientServer()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    // Set cookie
    if (data.session) {
      const cookieStore = await cookies()
      cookieStore.set('sb-access-token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
        sameSite: 'lax',
      })
    }

    // Garante que existe organização e usuário no banco
    await ensureUserExists(data.user, data.session?.access_token || '')

    return NextResponse.json({
      user: data.user,
      session: data.session,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

async function ensureUserExists(
  supabaseUser: { id: string; email?: string | null; user_metadata?: Record<string, unknown> },
  _accessToken: string,
) {
  // Verifica se já existe
  const existing = await prisma.user.findFirst({
    where: { supabaseUserId: supabaseUser.id },
    include: { organization: true },
  })

  if (existing && existing.organization) {
    return // já está tudo ok
  }

  // Cria organização + usuário
  const emailPart = supabaseUser.email?.split('@')[0] || 'user'
  const orgSlug = `org-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const orgName = `Organização de ${emailPart}`

  await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: orgName,
        slug: orgSlug,
      },
    })

    await tx.user.create({
      data: {
        name: (supabaseUser.user_metadata?.name as string) || emailPart,
        email: supabaseUser.email || '',
        role: 'OWNER',
        supabaseUserId: supabaseUser.id,
        organizationId: org.id,
      },
    })
  })
}
