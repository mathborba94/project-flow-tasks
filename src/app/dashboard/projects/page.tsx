import { getCurrentUserWithOrg } from '@/services/auth'
import { listProjects } from '@/services/project'
import { listOrganizationMembers } from '@/services/organization'
import { CreateProjectDialog } from './create-project-dialog'
import { Plus } from 'lucide-react'
import ProjectsList from '@/components/project/list'

export default async function ProjectsPage() {
  let organizationId = 'demo-org'
  let userId = ''
  let userRole = 'ADMIN'
  try {
    const { organizationId: orgId, user } = await getCurrentUserWithOrg()
    organizationId = orgId
    userId = user.id
    userRole = user.role
  } catch {}

  const [projects, members] = await Promise.all([
    listProjects(organizationId, { userId, userRole }),
    listOrganizationMembers(organizationId),
  ])

  return (
    <ProjectsList
      projects={projects}
      members={members}
      createButton={
        <CreateProjectDialog members={members}>
          <button className="inline-flex items-center gap-1.5 text-xs font-medium bg-white text-black px-3 py-1.5 rounded-md hover:bg-zinc-200 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Novo Projeto
          </button>
        </CreateProjectDialog>
      }
    />
  )
}
