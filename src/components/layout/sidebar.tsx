'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Clock,
  Users,
  BarChart3,
  LogOut,
  Settings,
  BookOpen,
  Bot,
  Info,
  X,
  HelpCircle,
} from 'lucide-react'
import QuickTaskButton from './quick-task'
import ThemeToggle from './theme-toggle'

type UserRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'

interface SidebarProps {
  userName?: string
  userEmail?: string
  userRole?: UserRole
  orgLogoUrl?: string
  orgLogoShape?: string
  orgName?: string
  onProfileClick?: () => void
  onNavItemClick?: () => void
}

function getNavItems(role?: UserRole) {
  const baseItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ]

  if (role === 'MEMBER') {
    return [
      ...baseItems,
      { href: '/dashboard/my-tasks', label: 'Minhas Tarefas', icon: CheckSquare },
      { href: '/dashboard/my-hours', label: 'Minhas Horas', icon: Clock },
      { href: '/dashboard/projects', label: 'Projetos', icon: FolderKanban },
      { href: '/dashboard/knowledge', label: 'Base de Conhecimento', icon: BookOpen },
      { href: '/dashboard/team', label: 'Equipe', icon: Users },
    ]
  }

  if (role === 'VIEWER') {
    return [
      ...baseItems,
      { href: '/dashboard/projects', label: 'Projetos', icon: FolderKanban },
      { href: '/dashboard/team', label: 'Equipe', icon: Users },
    ]
  }

  // OWNER / ADMIN - full access
  return [
    ...baseItems,
    { href: '/dashboard/my-tasks', label: 'Minhas Tarefas', icon: CheckSquare },
    { href: '/dashboard/my-hours', label: 'Minhas Horas', icon: Clock },
    { href: '/dashboard/projects', label: 'Projetos', icon: FolderKanban },
    { href: '/dashboard/team', label: 'Equipe', icon: Users },
    { href: '/dashboard/knowledge', label: 'Base de Conhecimento', icon: BookOpen },
    { href: '/dashboard/support-agents', label: 'Agente de Suporte', icon: Bot },
    { href: '/dashboard/reports', label: 'Relatórios', icon: BarChart3 },
  ]
}

export function Sidebar({ userName, userEmail, userRole, orgLogoUrl, orgLogoShape, orgName, onProfileClick, onNavItemClick }: SidebarProps) {
  const pathname = usePathname()
  const navItems = getNavItems(userRole)
  const [aboutOpen, setAboutOpen] = useState(false)
  const canAccessSettings = userRole === 'OWNER' || userRole === 'ADMIN'
  const isHorizontalLogo = orgLogoShape === 'horizontal'

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <aside className="w-[240px] h-full bg-[hsl(var(--sidebar-bg))] flex flex-col border-r border-[hsl(var(--sidebar-border))]">
      {/* Logo */}
      <div className="hidden md:flex px-4 h-[52px] items-center border-b border-[hsl(var(--sidebar-border)/0.5)]">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          {orgLogoUrl ? (
            isHorizontalLogo
              ? <img src={orgLogoUrl} alt={orgName || ''} className="h-6 w-auto max-w-[110px] object-contain" />
              : <img src={orgLogoUrl} alt={orgName || ''} className="w-6 h-6 rounded-md object-cover" />
          ) : (
            <div className="w-6 h-6 bg-[hsl(var(--sidebar-nav-hover))] border border-[hsl(var(--sidebar-border))] rounded-md flex items-center justify-center group-hover:border-[hsl(var(--sidebar-border)/0.7)] transition-colors">
              <svg className="w-3.5 h-3.5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          )}
          <span className="text-sm font-semibold text-[hsl(var(--sidebar-nav-text-active))] tracking-tight">{orgName || 'ProjectFlow'}</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navItems.map(item => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavItemClick}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[hsl(var(--sidebar-nav-active))] text-[hsl(var(--sidebar-nav-text-active))] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
                  : 'text-[hsl(var(--sidebar-nav-text))] hover:text-[hsl(var(--sidebar-nav-text-hover))] hover:bg-[hsl(var(--sidebar-nav-hover))]'
              }`}
            >
              <item.icon className={`w-[15px] h-[15px] flex-shrink-0 ${
                isActive ? 'text-[hsl(var(--sidebar-nav-icon-active))]' : 'text-[hsl(var(--sidebar-nav-icon))]'
              }`} />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom nav */}
      <div className="px-2 pb-2 space-y-0.5 border-t border-[hsl(var(--sidebar-border)/0.4)] pt-2">
        {/* Theme toggle */}
        <div className="flex items-center justify-between px-2.5 py-1">
          <span className="text-[11px] text-[hsl(var(--sidebar-nav-icon))]">Tema</span>
          <ThemeToggle />
        </div>

        {(() => {
          const bottomItems = [
            ...(canAccessSettings ? [{ href: '/dashboard/settings', label: 'Organização', icon: Settings }] : []),
            { href: '/dashboard/help', label: 'Ajuda', icon: HelpCircle },
          ]
          return bottomItems.map(item => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavItemClick}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[hsl(var(--sidebar-nav-active))] text-[hsl(var(--sidebar-nav-text-active))]'
                    : 'text-[hsl(var(--sidebar-nav-text))] hover:text-[hsl(var(--sidebar-nav-text-hover))] hover:bg-[hsl(var(--sidebar-nav-hover))]'
                }`}
              >
                <item.icon className={`w-[15px] h-[15px] flex-shrink-0 ${
                  isActive ? 'text-[hsl(var(--sidebar-nav-icon-active))]' : 'text-[hsl(var(--sidebar-nav-icon))]'
                }`} />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })
        })()}
      </div>

      {/* Quick Task Button */}
      {userRole !== 'VIEWER' && (
        <div className="px-2 pb-2">
          <QuickTaskButton userRole={userRole} />
        </div>
      )}

      {/* User */}
      <div className="px-2 py-2 border-t border-[hsl(var(--sidebar-border)/0.5)]">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors group hover:bg-[hsl(var(--sidebar-nav-hover))]">
          <button
            onClick={onProfileClick}
            disabled={!onProfileClick}
            className={`flex items-center gap-2 flex-1 min-w-0 ${onProfileClick ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <div className="w-6 h-6 bg-gradient-to-br from-violet-600/30 to-blue-600/30 rounded-full flex items-center justify-center dark:text-zinc-300 text-zinc-600 text-[10px] font-bold border border-violet-500/20 flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[13px] font-medium text-[hsl(var(--sidebar-nav-text-hover))] truncate">{userName || 'Usuário'}</p>
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="p-1 text-[hsl(var(--sidebar-nav-icon))] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
            title="Sair"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Version + About */}
      <div className="px-3 pb-3 relative">
        <button
          onClick={() => setAboutOpen(!aboutOpen)}
          className="w-full flex items-center justify-between px-1.5 py-1 rounded hover:bg-[hsl(var(--sidebar-nav-hover))] transition-colors group"
        >
          <p className="text-[10px] text-[hsl(var(--sidebar-nav-icon))] group-hover:text-[hsl(var(--sidebar-nav-text))] transition-colors">
            {process.env.NEXT_PUBLIC_APP_VERSION || 'v0.1.0'} · closed beta
          </p>
          <Info className="w-3 h-3 text-[hsl(var(--sidebar-nav-icon))] group-hover:text-[hsl(var(--sidebar-nav-text))] transition-colors" />
        </button>

        {/* About popup */}
        {aboutOpen && (
          <div className="absolute bottom-full left-2 right-2 mb-2 bg-[hsl(var(--card))] border border-[hsl(var(--sidebar-border))] rounded-xl p-4 shadow-2xl shadow-black/60 z-50">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[hsl(var(--sidebar-nav-active))] border border-[hsl(var(--sidebar-border))] rounded-md flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[hsl(var(--foreground))]">ProjectFlow</p>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Closed Beta</p>
                </div>
              </div>
              <button onClick={() => setAboutOpen(false)} className="p-0.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[11px] text-[hsl(var(--muted-foreground))] leading-relaxed mb-3">
              Plataforma de inteligência operacional para equipes de tecnologia.
              Controle de custo, prazo e SLA com insights de IA.
            </p>

            <div className="flex flex-wrap gap-1 mb-3">
              {['Next.js 16', 'React 19', 'Prisma 7', 'Supabase', 'OpenAI', 'TypeScript'].map(t => (
                <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-[hsl(var(--sidebar-nav-active))] text-[hsl(var(--muted-foreground))] border border-[hsl(var(--sidebar-border))]">
                  {t}
                </span>
              ))}
            </div>

            <div className="pt-2.5 border-t border-[hsl(var(--sidebar-border))]">
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-relaxed">
                Sugestões e feedback:{' '}
                <a
                  href="mailto:matheus@zbdigital.dev"
                  className="text-violet-400 hover:text-violet-300 transition-colors"
                >
                  matheus@zbdigital.dev
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
