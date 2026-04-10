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
import { Pencil, Check, X } from 'lucide-react'

const roleLabels: Record<string, string> = {
  OWNER: 'Proprietário',
  ADMIN: 'Administrador',
  MEMBER: 'Membro',
  VIEWER: 'Visualizador',
}

interface EditUserDialogProps {
  user: {
    id: string
    name: string
    email: string
    role: string
    hourlyCost: string | number
    isActive: boolean
  }
  canEdit: boolean
}

export function EditUserDialog({ user, canEdit }: EditUserDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    hourlyCost: String(user.hourlyCost),
    isActive: user.isActive,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setOpen(false)
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || 'Erro ao atualizar')
      }
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        {canEdit ? (
          <button className="p-1 text-zinc-600 dark:hover:text-zinc-300 text-zinc-700 hover:text-zinc-700 transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="text-[10px] text-zinc-700">{user.isActive ? 'Ativo' : 'Inativo'}</span>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-base">Editar Usuário</DialogTitle>
          <DialogDescription className="text-sm">
            Edite as informações de {user.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name" className="text-xs dark:text-zinc-400 text-zinc-400">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-8 text-sm"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email" className="text-xs dark:text-zinc-400 text-zinc-400">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="h-8 text-sm"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="hourlyCost" className="text-xs dark:text-zinc-400 text-zinc-400">Valor/hora</Label>
              <Input
                id="hourlyCost"
                type="number"
                value={formData.hourlyCost}
                onChange={(e) => setFormData({ ...formData, hourlyCost: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="role" className="text-xs dark:text-zinc-400 text-zinc-400">Função</Label>
              <div className="h-8 flex items-center px-2 text-sm dark:text-zinc-500 text-zinc-500">
                {roleLabels[user.role] || user.role}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs dark:text-zinc-400 text-zinc-400">Status</Label>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                formData.isActive
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-zinc-800 dark:text-zinc-500 text-zinc-500'
              }`}
            >
              {formData.isActive ? (
                <><Check className="w-3 h-3" /> Ativo</>
              ) : (
                <><X className="w-3 h-3" /> Inativo</>
              )}
            </button>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-2 border-t dark:border-zinc-800 border-zinc-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
