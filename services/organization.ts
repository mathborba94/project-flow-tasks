import prisma from '@/lib/prisma'
import type { CreateOrganizationInput, UpdateOrganizationInput, CreateUserInput } from '@/types/organization'

export async function createOrganization(data: CreateOrganizationInput & { ownerId: string; supabaseUserId: string }) {
  return prisma.organization.create({
    data: {
      name: data.name,
      slug: data.slug,
      users: {
        create: {
          name: data.ownerId,
          email: '',
          supabaseUserId: data.supabaseUserId,
          role: 'OWNER',
          hourlyCost: 0,
        },
      },
    },
    include: {
      users: true,
    },
  })
}

export async function getOrganizationById(id: string) {
  return prisma.organization.findUnique({
    where: { id },
    include: {
      users: true,
      _count: {
        select: {
          projects: true,
          tasks: true,
        },
      },
    },
  })
}

export async function getOrganizationBySlug(slug: string) {
  return prisma.organization.findUnique({
    where: { slug },
    include: {
      users: true,
    },
  })
}

export async function updateOrganization(id: string, data: UpdateOrganizationInput) {
  return prisma.organization.update({
    where: { id },
    data,
  })
}

export async function inviteUser(organizationId: string, data: { email: string; role: string }) {
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  return prisma.invitation.create({
    data: {
      organizationId,
      email: data.email,
      role: data.role as any,
      token,
      expiresAt,
    },
  })
}

export async function acceptInvitation(token: string, userId: string, email: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
  })

  if (!invitation || invitation.expiresAt < new Date()) {
    throw new Error('Invalid or expired invitation')
  }

  return prisma.user.update({
    where: { supabaseUserId: userId },
    data: {
      organizationId: invitation.organizationId,
      email,
    },
  })
}

export async function listOrganizationMembers(organizationId: string) {
  return prisma.user.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      hourlyCost: true,
      createdAt: true,
    },
  })
}