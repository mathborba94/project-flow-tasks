import { getCurrentUserWithOrg } from '@/services/auth'
import Link from 'next/link'
import { ArrowLeft, Users, Clock, Briefcase } from 'lucide-react'
import UserAllocationClient from './user-allocation-client'

export default async function AlocacaoUsuariosPage() {
  let organizationId = 'demo-org'
  try {
    const { organizationId: orgId } = await getCurrentUserWithOrg()
    organizationId = orgId
  } catch {}

  return <UserAllocationClient organizationId={organizationId} />
}
