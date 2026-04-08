import { getCurrentUserWithOrg } from '@/services/auth'
import { listProjects } from '@/services/project'
import { listOrganizationMembers } from '@/services/organization'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, Clock, DollarSign } from 'lucide-react'
import HoursReportClient from './hours-report-client'

export default async function ConsumoHorasPage() {
  let organizationId = 'demo-org'
  try {
    const { organizationId: orgId } = await getCurrentUserWithOrg()
    organizationId = orgId
  } catch {}

  const [projects, users] = await Promise.all([
    listProjects(organizationId),
    listOrganizationMembers(organizationId),
  ])

  return (
    <HoursReportClient
      projects={JSON.parse(JSON.stringify(projects))}
      users={JSON.parse(JSON.stringify(users))}
    />
  )
}
