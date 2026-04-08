import { NextResponse } from 'next/server'
import { createClientServer } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    if (!name?.trim() || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      )
    }

    const supabase = await createClientServer()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name.trim() },
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data.user) {
      return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 })
    }

    // Auto-confirm: session returned immediately
    if (data.session) {
      const cookieStore = await cookies()
      cookieStore.set('sb-access-token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
        sameSite: 'lax',
      })

      await ensureUserExists(data.user, name.trim())

      return NextResponse.json({ user: data.user, session: data.session })
    }

    // Email confirmation required
    return NextResponse.json(
      { emailConfirmation: true, message: 'Verifique seu email para confirmar o cadastro.' },
      { status: 200 }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function ensureUserExists(
  supabaseUser: { id: string; email?: string | null },
  name: string
) {
  const existing = await prisma.user.findFirst({
    where: { supabaseUserId: supabaseUser.id },
    include: { organization: true },
  })

  if (existing && existing.organization) return

  const emailPart = supabaseUser.email?.split('@')[0] || 'user'
  const orgSlug = `org-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: `Organização de ${name}`,
        slug: orgSlug,
      },
    })

    await tx.user.create({
      data: {
        name: name || emailPart,
        email: supabaseUser.email || '',
        role: 'OWNER',
        supabaseUserId: supabaseUser.id,
        organizationId: org.id,
      },
    })
  })
}
