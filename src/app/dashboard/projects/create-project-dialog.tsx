'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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

interface Member {
  id: string
  name: string
  email: string
}

interface CreateProjectDialogProps {
  members: Member[]
  children?: React.ReactNode
}

const statusLabels: Record<string, string> = {
  ACTIVE: 'Ativo',
  PAUSED: 'Pausado',
  COMPLETED: 'Concluído',
}

export function CreateProjectDialog({ members, children }: CreateProjectDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ownerId: '',
    budget: '',
    hourlyRate: '',
    status: 'ACTIVE',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          budget: formData.budget ? parseFloat(formData.budget) : undefined,
          hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
        }),
      })

      if (res.ok) {
        setOpen(false)
        setFormData({ name: '', description: '', ownerId: '', budget: '', hourlyRate: '', status: 'ACTIVE' })
        router.refresh()
      } else {
        setError('Erro ao criar projeto')
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
        {children || <Button>Novo Projeto</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-base">Novo Projeto</DialogTitle>
          <DialogDescription className="text-sm">
            Crie um projeto para organizar tarefas, tempo e custos.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name" className="text-xs text-zinc-400">Nome do Projeto</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Redesign do website"
              required
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="description" className="text-xs text-zinc-400">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva brevemente o objetivo..."
              rows={2}
              className="text-sm resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="owner" className="text-xs text-zinc-400">Responsável</Label>
              <Select
                value={formData.ownerId}
                onValueChange={(value) => setFormData({ ...formData, ownerId: value || '' })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id} className="text-sm">
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="status" className="text-xs text-zinc-400">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value || 'ACTIVE' })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key} className="text-sm">{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="budget" className="text-xs text-zinc-400">Orçamento (opcional)</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="0"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="hourlyRate" className="text-xs text-zinc-400">Valor/hora</Label>
              <Input
                id="hourlyRate"
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                placeholder="0"
                className="h-8 text-sm"
              />
            </div>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/60">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Projeto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
