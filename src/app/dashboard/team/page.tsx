import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getCurrentUserWithOrg } from '@/services/auth'
import { listOrganizationMembers, getPendingInvitations } from '@/services/organization'
import { getUserTimeStats } from '@/services/time-entry'
import { InviteUserDialog } from './invite-user-dialog'
import { EditUserDialog } from '@/components/team/edit-user-dialog'
import { PendingInvitations } from '@/components/team/pending-invitations'
import { Users, UserPlus } from 'lucide-react'

const roleConfig: Record<string, { label: string; dot: string }> = {
  OWNER: { label: 'Proprietário', dot: 'bg-purple-500' },
  ADMIN: { label: 'Admin', dot: 'bg-blue-500' },
  MEMBER: { label: 'Membro', dot: 'bg-emerald-500' },
  VIEWER: { label: 'Visualizador', dot: 'bg-zinc-500' },
}

function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6 animate-fade-in">
      <div>
        <h1 className="text-base font-semibold dark:text-zinc-100 text-zinc-900 tracking-tight">{title}</h1>
        <p className="text-sm dark:text-zinc-500 text-zinc-500 mt-0.5">{subtitle}</p>
      </div>
      {action}
    </div>
  )
}

export default async function TeamPage() {
  let organizationId = 'demo-org'
  let userRole = 'ADMIN'
  try {
    const { organizationId: orgId, user } = await getCurrentUserWithOrg()
    organizationId = orgId
    userRole = user.role
  } catch {}

  const isViewer = userRole !== 'OWNER' && userRole !== 'ADMIN'

  const [members, pendingInvitations] = await Promise.all([
    listOrganizationMembers(organizationId),
    isViewer ? Promise.resolve([]) : getPendingInvitations(organizationId),
  ])

  const membersWithStats = await Promise.all(
    members.map(async (member) => {
      const stats = await getUserTimeStats(organizationId, member.id)
      return { ...member, stats }
    })
  )

  return (
    <div className="p-6 max-w-6xl">
      <PageHeader
        title="Equipe"
        subtitle={isViewer ? 'Membros da sua organização' : 'Gerencie os membros da sua organização'}
        action={!isViewer ? (
          <InviteUserDialog>
            <button className="inline-flex items-center gap-1.5 text-xs font-medium dark:bg-white dark:text-black bg-zinc-900 text-white px-3 py-1.5 rounded-md hover:bg-zinc-200 transition-colors">
              <UserPlus className="w-3.5 h-3.5" />
              Convidar
            </button>
          </InviteUserDialog>
        ) : undefined}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {membersWithStats.map((member, i) => {
          const role = roleConfig[member.role] || roleConfig.MEMBER
          const initials = member.name.charAt(0).toUpperCase()
          return (
            <div
              key={member.id}
              className="dark:bg-zinc-950/50 bg-white border dark:border-zinc-800/60 border-zinc-200 rounded-lg p-4 dark:hover:hover:border-zinc-700/60 hover:border-zinc-300 transition-colors animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="w-8 h-8 ring-1 ring-zinc-800">
                  <AvatarFallback className="dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-400 text-zinc-400 text-xs font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium dark:text-zinc-200 text-zinc-800 truncate">{member.name}</h3>
                    {!isViewer && (
                      <EditUserDialog
                        user={{
                          id: member.id,
                          name: member.name,
                          email: member.email,
                          role: member.role,
                          hourlyCost: Number(member.hourlyCost),
                          isActive: member.isActive ?? true,
                        }}
                        canEdit={true}
                      />
                    )}
                  </div>
                  <p className="text-xs dark:text-zinc-600 text-zinc-400 truncate">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-1.5 h-1.5 rounded-full ${role.dot}`} />
                <span className="text-xs dark:text-zinc-500 text-zinc-500">{role.label}</span>
              </div>
              {!isViewer && (
                <div className="grid grid-cols-3 gap-3 pt-3 border-t dark:border-zinc-800/40 border-zinc-200 text-center">
                  <div>
                    <p className="text-sm font-medium dark:text-zinc-200 text-zinc-800 tabular-nums">{Math.round(member.stats.totalHours)}h</p>
                    <p className="text-[11px] dark:text-zinc-600 text-zinc-400 mt-0.5">Horas</p>
                  </div>
                  <div className="border-x dark:border-zinc-800/40 border-zinc-200">
                    <p className="text-sm font-medium dark:text-zinc-200 text-zinc-800 tabular-nums">R$ {Math.round(member.stats.totalCost).toLocaleString('pt-BR')}</p>
                    <p className="text-[11px] dark:text-zinc-600 text-zinc-400 mt-0.5">Custo</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium dark:text-zinc-200 text-zinc-800 tabular-nums">R$ {Number(member.hourlyCost) || 0}</p>
                    <p className="text-[11px] dark:text-zinc-600 text-zinc-400 mt-0.5">Taxa/h</p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {members.length === 0 && (
        <div className="text-center py-20 animate-fade-in">
          <div className="w-10 h-10 dark:bg-zinc-900 bg-zinc-100 border dark:border-zinc-800 border-zinc-300 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Users className="w-5 h-5 dark:text-zinc-700 text-zinc-300" />
          </div>
          <p className="text-sm dark:text-zinc-500 text-zinc-500">Nenhum membro na equipe</p>
          <p className="text-xs dark:text-zinc-700 text-zinc-300 mt-1">Convide alguém para começar</p>
        </div>
      )}

      {!isViewer && pendingInvitations.length > 0 && (
        <div className="mt-8 animate-fade-in">
          <h2 className="text-sm font-medium dark:text-zinc-400 text-zinc-400 mb-3">Convites pendentes</h2>
          <PendingInvitations invitations={pendingInvitations} />
        </div>
      )}
    </div>
  )
}
