'use client'

import { useState, useEffect, useCallback } from 'react'
import { Menu, X } from 'lucide-react'
import { Sidebar } from '@/components/layout/sidebar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function DashboardSidebarClient({
  userName,
  userEmail,
  userRole,
  orgLogoUrl,
  orgName,
}: {
  userName?: string
  userEmail?: string
  userRole?: string
  orgLogoUrl?: string
  orgName?: string
}) {
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileName, setProfileName] = useState(userName || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), [])

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleSaveProfile = async () => {
    if (!profileName.trim()) return
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName.trim() }),
      })
      if (res.ok) {
        setMessage('Nome atualizado!')
      }
    } catch {
      setMessage('Erro ao atualizar nome')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) return
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/users/me/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (res.ok) {
        setMessage('Senha atualizada!')
        setCurrentPassword('')
        setNewPassword('')
      } else {
        const data = await res.json()
        setMessage(data.error || 'Erro ao alterar senha')
      }
    } catch {
      setMessage('Erro ao alterar senha')
    } finally {
      setSaving(false)
    }
  }

  const navProps = {
    userName,
    userEmail,
    userRole: userRole as any,
    orgLogoUrl,
    orgName,
    onProfileClick: () => {
      setProfileName(userName || '')
      setProfileOpen(true)
      setMobileMenuOpen(false)
    },
    onNavItemClick: closeMobileMenu,
  }

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-12 bg-[#09090b]/95 backdrop-blur-sm border-b border-zinc-800/60 flex items-center justify-between px-3">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-1.5 -ml-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          {orgLogoUrl ? (
            <img src={orgLogoUrl} alt="" className="w-5 h-5 rounded-md object-cover" />
          ) : (
            <div className="w-5 h-5 bg-zinc-800 rounded-md flex items-center justify-center">
              <svg className="w-3 h-3 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          )}
          <span className="text-xs font-semibold text-zinc-200">{orgName || 'ProjectFlow'}</span>
        </div>
        <div className="w-8" />
      </header>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Sidebar (Drawer) */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-[260px] bg-[#09090b] transform transition-transform duration-200 ease-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 h-12 border-b border-zinc-800/60 flex-shrink-0">
            <span className="text-sm font-semibold text-zinc-200">Menu</span>
            <button
              onClick={closeMobileMenu}
              className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <Sidebar {...navProps} />
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-shrink-0 h-screen sticky top-0">
        <Sidebar {...navProps} />
      </div>

      {/* Profile Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Meu Perfil</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs text-zinc-400">Nome</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="bg-zinc-900/60 border-zinc-800"
                />
                <Button size="sm" onClick={handleSaveProfile} disabled={saving || !profileName.trim()}>
                  Salvar
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-xs text-zinc-400">Email</Label>
              <p className="text-sm text-zinc-300 mt-1">{userEmail || '-'}</p>
            </div>

            <div className="border-t border-zinc-800/40 pt-4">
              <Label className="text-xs text-zinc-400">Alterar Senha</Label>
              <div className="space-y-2 mt-2">
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Senha atual"
                  className="bg-zinc-900/60 border-zinc-800"
                />
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nova senha"
                  className="bg-zinc-900/60 border-zinc-800"
                />
                <Button
                  size="sm"
                  onClick={handleChangePassword}
                  disabled={saving || !currentPassword || !newPassword}
                >
                  Alterar Senha
                </Button>
              </div>
            </div>

            {message && (
              <p className="text-xs text-zinc-400 text-center">{message}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
