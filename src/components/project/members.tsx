'use client'

import { useState, useEffect } from 'react'
import { User, UserPlus, Trash2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Member {
  id: string
  role: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

interface OrgUser {
  id: string
  name: string
  email: string
  role: string
}

export default function MembersClient({ projectId }: { projectId: string }) {
  const [members, setMembers] = useState<Member[]>([])
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}/members`).then(r => r.json()),
    ]).then(([membersData]) => {
      setMembers(membersData)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [projectId])

  useEffect(() => {
    // Buscar usuários da org que ainda não são membros
    if (showAdd) {
      fetch('/api/users')
        .then(r => r.json())
        .then(data => {
          const memberIds = new Set(members.map(m => m.user.id))
          const nonMembers = data.filter((u: OrgUser) => !memberIds.has(u.id))
          setOrgUsers(nonMembers)
        })
        .catch(() => {})
    }
  }, [showAdd, members])

  const handleAddMember = async (userId: string) => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (res.ok) {
        const newMember = await res.json()
        setMembers(prev => [...prev, newMember])
        setOrgUsers(prev => prev.filter(u => u.id !== userId))
      }
    } catch {
      // silent
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/members?userId=${userId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setMembers(prev => prev.filter(m => m.user.id !== userId))
      }
    } catch {
      // silent
    }
  }

  const filteredUsers = orgUsers.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const roleLabels: Record<string, string> = {
    OWNER: 'Proprietário',
    ADMIN: 'Administrador',
    MEMBER: 'Membro',
    VIEWER: 'Visualizador',
  }

  const projectRoleLabels: Record<string, string> = {
    OWNER: 'Proprietário',
    ADMIN: 'Admin',
    MEMBER: 'Membro',
    VIEWER: 'Visualizador',
  }

  if (loading) {
    return (
      <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-8 text-center">
        <p className="text-sm text-zinc-600">Carregando membros...</p>
      </div>
    )
  }

  return (
    <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg">
      <div className="px-4 py-3 border-b border-zinc-800/40 flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-200">Membros</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowAdd(!showAdd)}
          className="text-zinc-400 hover:text-zinc-200 h-7 px-2"
        >
          <UserPlus className="w-3.5 h-3.5" />
        </Button>
      </div>

      {showAdd && (
        <div className="p-4 border-b border-zinc-800/40 space-y-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar usuário..."
              className="pl-7 bg-zinc-900/60 border-zinc-800 text-sm"
            />
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <div
                  key={user.id}
                  className="flex items-center justify-between px-3 py-2 rounded-md bg-zinc-900/40"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-3 h-3 text-zinc-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-zinc-200 truncate">{user.name}</p>
                      <p className="text-[10px] text-zinc-600 truncate">{user.email}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAddMember(user.id)}
                    disabled={submitting}
                    className="h-6 px-2 text-xs"
                  >
                    Adicionar
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-600 text-center py-2">
                {searchTerm ? 'Nenhum usuário encontrado' : 'Todos os usuários já são membros'}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="divide-y divide-zinc-800/40">
        {members.length > 0 ? (
          members.map((member) => (
            <div key={member.id} className="px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-zinc-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200 truncate">{member.user.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-600">{roleLabels[member.user.role]}</span>
                  <span className="text-[10px] text-zinc-700">•</span>
                  <span className="text-[10px] text-zinc-500">{projectRoleLabels[member.role] || member.role}</span>
                </div>
              </div>
              <button
                onClick={() => handleRemoveMember(member.user.id)}
                className="text-zinc-600 hover:text-red-400 transition-colors p-1"
                title="Remover membro"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        ) : (
          <div className="px-4 py-8 text-center text-xs text-zinc-600">
            Nenhum membro adicionado
          </div>
        )}
      </div>
    </div>
  )
}
