import { getCurrentUserWithOrg } from '@/services/auth'
import prisma from '@/lib/prisma'
import KnowledgeManager from './knowledge-manager'

export default async function KnowledgePage() {
  let organizationId = ''
  let userRole = 'MEMBER'
  try {
    const { organizationId: orgId, user } = await getCurrentUserWithOrg()
    organizationId = orgId
    userRole = user.role
  } catch {
    return (
      <div className="p-6">
        <p className="text-sm dark:text-zinc-500 text-zinc-500">Não autenticado.</p>
      </div>
    )
  }

  const [categories, articles, org] = await Promise.all([
    prisma.knowledgeCategory.findMany({
      where: { organizationId },
      include: { _count: { select: { articles: true } } },
      orderBy: { name: 'asc' },
    }),
    prisma.knowledgeBase.findMany({
      where: { organizationId },
      include: { category: { select: { id: true, name: true } } },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { publicKnowledgeBase: true, slug: true },
    }),
  ])

  return (
    <KnowledgeManager
      categories={JSON.parse(JSON.stringify(categories))}
      articles={JSON.parse(JSON.stringify(articles))}
      publicKnowledgeBase={org?.publicKnowledgeBase || false}
      orgSlug={org?.slug || ''}
      userRole={userRole}
    />
  )
}
