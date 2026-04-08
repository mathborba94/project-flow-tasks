'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  MEMBER: 'Membro',
  VIEWER: 'Visualizador',
}

interface InviteUserDialogProps {
  children?: React.ReactNode
}

export function InviteUserDialog({ children }: InviteUserDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    role: 'MEMBER',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao enviar convite')
      } else {
        setSuccess(true)
        setFormData({ email: '', role: 'MEMBER' })
        setTimeout(() => {
          setOpen(false)
          setSuccess(false)
        }, 1500)
        router.refresh()
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        {children || <Button>Convidar Usuário</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-base">Convidar Usuário</DialogTitle>
          <DialogDescription className="text-sm">
            Envie um convite por email para adicionar alguém à equipe.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email" className="text-xs text-zinc-400">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="usuario@empresa.com"
              required
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="role" className="text-xs text-zinc-400">Função</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value || 'MEMBER' })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roleLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key} className="text-sm">{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          {success && <p className="text-xs text-emerald-400">Convite enviado com sucesso!</p>}
          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/60">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Convite'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
