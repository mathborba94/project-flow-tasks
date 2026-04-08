import { getCurrentUserWithOrg } from '@/services/auth'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import AgentForm from './agent-form'

export default async function SupportAgentConfigPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { organizationId } = await getCurrentUserWithOrg()

  const isNew = id === 'new'

  const [projects, agent] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId, archived: false },
      select: { id: true, name: true, color: true },
      orderBy: { name: 'asc' },
    }),
    isNew
      ? null
      : prisma.supportAgent.findFirst({
          where: { id, organizationId },
          include: { sessions: { orderBy: { updatedAt: 'desc' }, take: 10, include: { _count: { select: { messages: true } } } } },
        }),
  ])

  if (!isNew && !agent) notFound()

  const origin = process.env.NEXT_PUBLIC_APP_URL || ''

  return (
    <AgentForm
      agent={agent as any}
      projects={projects}
      isNew={isNew}
      origin={origin}
    />
  )
}
