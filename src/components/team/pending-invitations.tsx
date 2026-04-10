'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Clock, Trash2, Loader2 } from 'lucide-react'

const roleLabel: Record<string, string> = {
  OWNER: 'Proprietário', ADMIN: 'Admin', MEMBER: 'Membro', VIEWER: 'Visualizador',
}

interface Invitation {
  id: string
  token: string
  email: string
  role: string
  expiresAt: Date | string
  createdAt: Date | string
}

export function PendingInvitations({ invitations }: { invitations: Invitation[] }) {
  const router = useRouter()
  const [revoking, setRevoking] = useState<string | null>(null)

  async function handleRevoke(id: string, token: string) {
    setRevoking(id)
    try {
      const res = await fetch(`/api/invitations/${token}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error ?? 'Erro ao revogar convite')
        return
      }
      router.refresh()
    } finally {
      setRevoking(null)
    }
  }

  function isExpired(expiresAt: Date | string) {
    return new Date(expiresAt) < new Date()
  }

  return (
    <div className="space-y-2">
      {invitations.map((inv) => {
        const expired = isExpired(inv.expiresAt)
        return (
          <div
            key={inv.id}
            className="flex items-center justify-between dark:bg-zinc-950/50 bg-white border dark:border-zinc-800 border-zinc-300/60 rounded-lg px-4 py-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-7 h-7 dark:bg-zinc-900 bg-zinc-100 border dark:border-zinc-800 border-zinc-300 rounded-md flex items-center justify-center shrink-0">
                <Mail className="w-3.5 h-3.5 dark:text-zinc-600 text-zinc-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm dark:text-zinc-300 text-zinc-700 truncate">{inv.email}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-violet-400">{roleLabel[inv.role] ?? inv.role}</span>
                  <span className="text-zinc-700">·</span>
                  <span className={`text-[11px] flex items-center gap-1 ${expired ? 'text-red-500' : 'dark:text-zinc-600 text-zinc-400'}`}>
                    <Clock className="w-3 h-3" />
                    {expired
                      ? 'Expirado'
                      : `Expira ${new Date(inv.expiresAt).toLocaleDateString('pt-BR')}`}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleRevoke(inv.id, inv.token)}
              disabled={revoking === inv.id}
              title="Revogar convite"
              className="ml-3 p-1.5 dark:text-zinc-600 text-zinc-400 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              {revoking === inv.id
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        )
      })}
    </div>
  )
}
