import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClientServer } from '@/lib/supabase'
import prisma from '@/lib/prisma'
import type { User } from '@prisma/client'

export async function getSession() {
  const cookieStore = await cookies()
  const supabase = createClientServer({ getAll: () => cookieStore.getAll() })
  
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
  const user = await requireAuth()
  
  const dbUser = await prisma.user.findFirst({
    where: { supabaseUserId: user.id },
    include: { organization: true },
  })

  if (!dbUser) {
    throw new Error('User organization not found')
  }

  return dbUser
}

export async function getCurrentUserWithOrg(): Promise<{
  user: User
  organizationId: string
}> {
  const user = await requireAuth()
  
  const dbUser = await prisma.user.findFirst({
    where: { supabaseUserId: user.id },
  })

  if (!dbUser) {
    throw new Error('User not found')
  }

  return {
    user: dbUser,
    organizationId: dbUser.organizationId,
  }
}

export async function getUserAndValidateOrg(organizationId: string) {
  const user = await requireAuth()
  
  const dbUser = await prisma.user.findFirst({
    where: { supabaseUserId: user.id },
  })

  if (!dbUser || dbUser.organizationId !== organizationId) {
    throw new Error('Unauthorized')
  }

  return dbUser
}