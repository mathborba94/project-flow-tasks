import { Sidebar } from '@/components/layout/sidebar'
import DashboardSidebarClient from '@/components/layout/sidebar-wrapper'
import { getSession } from '@/services/auth'
import prisma from '@/lib/prisma'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let userName: string | undefined
  let userEmail: string | undefined
  let userRole: string | undefined
  let orgLogoUrl: string | undefined
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
          select: { name: true, logoUrl: true },
        })
        if (org) {
          orgName = org.name
          orgLogoUrl = org.logoUrl || undefined
        }
      }
    }
  } catch {
    // silent
  }

  return (
    <div className="flex h-screen bg-[#09090b]">
      <DashboardSidebarClient
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        orgLogoUrl={orgLogoUrl}
        orgName={orgName}
      />
      <main className="flex-1 overflow-auto pt-12 md:pt-0 bg-[#0b0b0e]">{children}</main>
    </div>
  )
}
