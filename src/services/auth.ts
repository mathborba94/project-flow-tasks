import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClientServer } from '@/lib/supabase-server'
import prisma from '@/lib/prisma'
import type { User } from '@prisma/client'

/**
 * Garante que o usuário autenticado existe na tabela users e tem organização.
 * Se não existe, cria uma organização e o vínculo automaticamente.
 */
export async function ensureUserAndOrganization() {
  const supabase = await createClientServer()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  // Busca usuário existente
  let dbUser = await prisma.user.findFirst({
    where: { supabaseUserId: user.id },
    include: { organization: true },
  })

  if (dbUser && dbUser.organization) {
    return dbUser
  }

  // Usuário existe mas não tem org — cria org e vincula
  if (dbUser) {
    const orgSlug = `org-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const orgName = `Organização de ${user.email?.split('@')[0] || 'Usuário'}`

    const org = await prisma.organization.create({
      data: {
        name: orgName,
        slug: orgSlug,
      },
    })

    dbUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        organizationId: org.id,
        role: dbUser.role || 'OWNER',
      },
      include: { organization: true },
    })
    return dbUser
  }

  // Usuário não existe — cria org + usuário
  const orgSlug = `org-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const orgName = `Organização de ${user.email?.split('@')[0] || 'Usuário'}`

  const org = await prisma.organization.create({
    data: {
      name: orgName,
      slug: orgSlug,
      users: {
        create: {
          name: user.email?.split('@')[0] || 'Usuário',
          email: user.email || '',
          role: 'OWNER',
          supabaseUserId: user.id,
        },
      },
    },
    include: {
      users: true,
    },
  })

  const newUser = org.users[0]
  if (!newUser) {
    throw new Error('Falha ao criar usuário')
  }

  return await prisma.user.findFirst({
    where: { id: newUser.id },
    include: { organization: true },
  })
}

export async function getSession() {
  const supabase = await createClientServer()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

export async function requireAuth() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  return user
}

export async function getCurrentOrganization() {
  const dbUser = await ensureUserAndOrganization()

  if (!dbUser || !dbUser.organization) {
    throw new Error('User organization not found')
  }

  return dbUser
}

export async function getCurrentUserWithOrg(): Promise<{
  user: User
  organizationId: string
}> {
  const dbUser = await ensureUserAndOrganization()

  if (!dbUser) {
    throw new Error('User not found')
  }

  return {
    user: dbUser,
    organizationId: dbUser.organizationId,
  }
}

export async function getUserAndValidateOrg(organizationId: string) {
  const dbUser = await ensureUserAndOrganization()

  if (!dbUser || dbUser.organizationId !== organizationId) {
    throw new Error('Unauthorized')
  }

  return dbUser
}