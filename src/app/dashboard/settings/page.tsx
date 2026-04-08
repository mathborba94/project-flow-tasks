import { getCurrentUserWithOrg } from '@/services/auth'
import prisma from '@/lib/prisma'
import OrganizationForm from './organization-form'
import TaskTypesManager from '@/components/settings/task-types-manager'

export default async function SettingsPage() {
  const { organizationId } = await getCurrentUserWithOrg()

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      taskTypes: {
        orderBy: { name: 'asc' },
      },
    },
  })

  if (!org) {
    return (
      <div className="p-6">
        <p className="text-sm text-zinc-500">Organização não encontrada</p>
      </div>
    )
  }

  const orgData = {
    ...org,
    logoUrl: org.logoUrl || null,
    publicKnowledgeBase: org.publicKnowledgeBase || false,
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-base font-semibold text-zinc-100 tracking-tight">Configuracoes</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Gerencie as configuracoes da sua organizacao</p>
      </div>

      {/* Organization section */}
      <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-6 animate-fade-in-delay">
        <h2 className="text-sm font-medium text-zinc-200 mb-4">Organizacao</h2>
        <OrganizationForm org={orgData} />
      </div>

      {/* Task Types section */}
      <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-6 animate-fade-in-delay">
        <h2 className="text-sm font-medium text-zinc-200 mb-4">Tipos de Tarefa</h2>
        <TaskTypesManager
          taskTypes={org.taskTypes}
          defaultTaskTypeId={org.defaultTaskTypeId}
        />
      </div>
    </div>
  )
}
