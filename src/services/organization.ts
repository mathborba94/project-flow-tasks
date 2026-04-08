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

export async function acceptInvitation(token: string, supabaseUserId: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { organization: true },
  })

  if (!invitation) throw new Error('Convite não encontrado')
  if (invitation.expiresAt < new Date()) throw new Error('Convite expirado')
  if (invitation.acceptedAt) throw new Error('Convite já foi aceito')

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { supabaseUserId },
      data: {
        organizationId: invitation.organizationId,
        role: invitation.role,
      },
    })

    await tx.invitation.update({
      where: { token },
      data: { acceptedAt: new Date() },
    })
  })

  return invitation
}

export async function getInvitationByToken(token: string) {
  return prisma.invitation.findUnique({
    where: { token },
    include: {
      organization: { select: { name: true, slug: true } },
    },
  })
}

export async function revokeInvitation(token: string, organizationId: string) {
  const invitation = await prisma.invitation.findUnique({ where: { token } })

  if (!invitation || invitation.organizationId !== organizationId) {
    throw new Error('Convite não encontrado')
  }
  if (invitation.acceptedAt) {
    throw new Error('Convite já aceito — não pode ser revogado')
  }

  return prisma.invitation.delete({ where: { token } })
}

export async function getPendingInvitations(organizationId: string) {
  return prisma.invitation.findMany({
    where: { organizationId, acceptedAt: null },
    orderBy: { createdAt: 'desc' },
  })
}

export async function listOrganizationMembers(organizationId: string) {
  const users = await prisma.user.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      hourlyCost: true,
      isActive: true,
      createdAt: true,
    },
  })

  // Serialize Decimal to number for Client Components
  return users.map(u => ({
    ...u,
    hourlyCost: Number(u.hourlyCost),
  }))
}