import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import AgentChat from './agent-chat'

export const dynamic = 'force-dynamic'

export default async function PublicAgentPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const agent = await prisma.supportAgent.findUnique({
    where: { shareToken: token, active: true },
    select: {
      id: true,
      name: true,
      personality: true,
      shareToken: true,
      organization: { select: { name: true, logoUrl: true, slug: true } },
      project: { select: { id: true, name: true, color: true } },
    },
  })

  if (!agent) notFound()

  return <AgentChat agent={agent} />
}
