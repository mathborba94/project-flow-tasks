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

  const canCreateProject = userRole !== 'VIEWER'
  // MEMBER can only set themselves as owner
  const ownerMembers = userRole === 'MEMBER'
    ? members.filter(m => m.id === userId)
    : members

  return (
    <ProjectsList
      projects={projects}
      members={members}
      createButton={
        canCreateProject ? (
          <CreateProjectDialog members={ownerMembers} currentUserId={userId} userRole={userRole}>
            <button className="inline-flex items-center gap-1.5 text-xs font-medium dark:bg-white dark:text-black bg-zinc-900 text-white px-3 py-1.5 rounded-md hover:bg-zinc-200 transition-colors">
              <Plus className="w-3.5 h-3.5" />
              Novo Projeto
            </button>
          </CreateProjectDialog>
        ) : undefined
      }
    />
  )
}
