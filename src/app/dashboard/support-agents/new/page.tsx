import { getCurrentUserWithOrg } from '@/services/auth'
import prisma from '@/lib/prisma'
import AgentForm from '../[id]/agent-form'

export default async function NewSupportAgentPage() {
  const { organizationId } = await getCurrentUserWithOrg()

  const projects = await prisma.project.findMany({
    where: { organizationId, archived: false },
    select: { id: true, name: true, color: true },
    orderBy: { name: 'asc' },
  })

  const origin = process.env.NEXT_PUBLIC_APP_URL || ''

  return <AgentForm agent={null} projects={projects} isNew origin={origin} />
}
