import { notFound } from 'next/navigation'
import { Zap } from 'lucide-react'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import PublicTaskForm from '@/components/project/public-task-form'

export const dynamic = 'force-dynamic'

export default async function PublicTaskFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { projectId } = await params

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      description: true,
      color: true,
      organizationId: true,
      allowPublicTasks: true,
    },
  })

  if (!project || !project.allowPublicTasks) {
    notFound()
  }

  const org = await prisma.organization.findUnique({
    where: { id: project.organizationId },
    select: { logoUrl: true, slug: true, publicKnowledgeBase: true },
  })

  // Get project members to show as assignees options
  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { user: { name: 'asc' } },
  })

  // Get pipeline stages
  const pipeline = await prisma.pipeline.findUnique({
    where: { projectId },
    include: {
      stages: {
        orderBy: { order: 'asc' },
      },
    },
  })

  // Get task types
  const taskTypes = await prisma.taskType.findMany({
    where: { organizationId: project.organizationId },
    orderBy: { name: 'asc' },
  })

  const orgTaskTypes = await prisma.organization.findUnique({
    where: { id: project.organizationId },
    select: { defaultTaskTypeId: true },
  })

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col" style={{ background: 'linear-gradient(160deg, #0e0b1e 0%, #09090b 45%, #090e1b 100%)' }}>
      {/* Glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-violet-600/6 rounded-full blur-[140px] pointer-events-none" />

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div
              className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center border"
              style={{ backgroundColor: `${project.color}15`, borderColor: `${project.color}30` }}
            >
              {org?.logoUrl ? (
                <img src={org.logoUrl} alt="" className="w-9 h-9 rounded-xl object-cover" />
              ) : (
                <div className="w-5 h-5 rounded-full" style={{ backgroundColor: project.color }} />
              )}
            </div>
            <h1 className="text-2xl font-bold text-zinc-100 mb-2">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">{project.description}</p>
            )}
          </div>

          {/* Form */}
          <PublicTaskForm
            projectId={projectId}
            orgSlug={org?.publicKnowledgeBase ? (org.slug ?? undefined) : undefined}
            members={members.map(m => ({
              id: m.user.id,
              name: m.user.name,
              email: m.user.email,
            }))}
            stages={pipeline?.stages.map(s => ({
              id: s.id,
              name: s.name,
              order: s.order,
            })) || []}
            taskTypes={taskTypes.map(t => ({
              id: t.id,
              name: t.name,
              slaMinutes: t.slaMinutes,
            }))}
            defaultTaskTypeId={orgTaskTypes?.defaultTaskTypeId}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800/40 py-4 px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-2">
          <div className="w-4 h-4 bg-zinc-800 rounded-sm flex items-center justify-center">
            <Zap className="w-2.5 h-2.5 text-violet-400" />
          </div>
          <p className="text-[11px] text-zinc-600">
            Formulário gerado por{' '}
            <Link href="/" className="text-zinc-500 hover:text-zinc-400 transition-colors font-medium">
              ProjectFlow
            </Link>
            {' '}· Plataforma de inteligência operacional para equipes de tecnologia
          </p>
        </div>
      </footer>
    </div>
  )
}
