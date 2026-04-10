import { Sidebar } from '@/components/layout/sidebar'
import DashboardSidebarClient from '@/components/layout/sidebar-wrapper'
import ThemeToggle from '@/components/layout/theme-toggle'
import { getSession } from '@/services/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let userName: string | undefined
  let userEmail: string | undefined
  let userRole: string | undefined
  let orgLogoUrl: string | undefined
  let orgLogoShape: string | undefined
  let orgName: string | undefined

  try {
    const session = await getSession()
    if (session) {
      const dbUser = await prisma.user.findFirst({
        where: { supabaseUserId: session.id },
      })
      if (dbUser) {
        userName = dbUser.name
        userEmail = dbUser.email
        userRole = dbUser.role

        const org = await prisma.organization.findUnique({
          where: { id: dbUser.organizationId },
          select: { name: true, logoUrl: true, logoShape: true },
        })
        if (org) {
          orgName = org.name
          orgLogoUrl = org.logoUrl || undefined
          orgLogoShape = org.logoShape || 'square'
        }
      }
    }
  } catch {
    // silent
  }

  return (
    <div className="flex h-screen bg-[hsl(var(--sidebar-bg))] transition-colors">
      <DashboardSidebarClient
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        orgLogoUrl={orgLogoUrl}
        orgLogoShape={orgLogoShape}
        orgName={orgName}
      />
      <main className="flex-1 overflow-auto pt-12 md:pt-0 bg-[hsl(var(--background))] text-[hsl(var(--foreground))] transition-colors">
        {children}
      </main>
    </div>
  )
}
