import { getCurrentUserWithOrg } from '@/services/auth'
import prisma from '@/lib/prisma'
import OrganizationForm from './organization-form'
import TaskTypesManager from '@/components/settings/task-types-manager'

export default async function SettingsPage() {
  const { organizationId, user } = await getCurrentUserWithOrg()

  if (user.role === 'MEMBER' || user.role === 'VIEWER') {
    return (
      <div className="p-6 max-w-3xl">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 dark:bg-zinc-900 bg-zinc-100 dark:border-zinc-800 border-zinc-300 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 dark:text-zinc-700 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-sm dark:text-zinc-500 text-zinc-500">Apenas administradores podem acessar as configurações</p>
        </div>
      </div>
    )
  }

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
        <p className="text-sm dark:text-zinc-500 text-zinc-500">Organização não encontrada</p>
      </div>
    )
  }

  const orgData = {
    ...org,
    logoUrl: org.logoUrl || null,
    logoShape: org.logoShape || 'square',
    publicKnowledgeBase: org.publicKnowledgeBase || false,
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-base font-semibold dark:text-zinc-100 text-zinc-900 tracking-tight">Configurações</h1>
        <p className="text-sm dark:text-zinc-500 text-zinc-500 mt-0.5">Gerencie as configurações da sua organização</p>
      </div>

      {/* Organization section */}
      <div className="dark:bg-zinc-950/50 bg-white dark:border-zinc-800/60 border-zinc-200 rounded-lg p-6 animate-fade-in-delay">
        <h2 className="text-sm font-medium dark:text-zinc-200 text-zinc-800 mb-4">Organização</h2>
        <OrganizationForm org={orgData} />
      </div>

      {/* Task Types section */}
      <div className="dark:bg-zinc-950/50 bg-white dark:border-zinc-800/60 border-zinc-200 rounded-lg p-6 animate-fade-in-delay-2">
        <h2 className="text-sm font-medium dark:text-zinc-200 text-zinc-800 mb-4">Tipos de Tarefa</h2>
        <TaskTypesManager
          taskTypes={org.taskTypes}
          defaultTaskTypeId={org.defaultTaskTypeId}
        />
      </div>
    </div>
  )
}
