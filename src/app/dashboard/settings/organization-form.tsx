'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Check, Loader2, Upload, X, ImageIcon } from 'lucide-react'

const timezones = [
  { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3)' },
  { value: 'America/Manaus', label: 'Manaus (GMT-4)' },
  { value: 'America/Rio_Branco', label: 'Rio Branco (GMT-5)' },
  { value: 'America/Noronha', label: 'Fernando de Noronha (GMT-2)' },
  { value: 'US/Eastern', label: 'Eastern Time (US)' },
  { value: 'US/Pacific', label: 'Pacific Time (US)' },
  { value: 'Europe/Lisbon', label: 'Lisboa' },
  { value: 'Europe/London', label: 'London' },
]

interface OrgData {
  id: string
  name: string
  slug: string
  description: string | null
  website: string | null
  timezone: string
  logoUrl: string | null
  logoShape: string
  publicKnowledgeBase: boolean
}

export default function OrganizationForm({ org }: { org: OrgData }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    name: org.name,
    slug: org.slug,
    description: org.description || '',
    website: org.website || '',
    timezone: org.timezone,
    logoUrl: org.logoUrl || '',
    logoShape: org.logoShape || 'square',
    publicKnowledgeBase: org.publicKnowledgeBase || false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSaved(false)

    try {
      const res = await fetch(`/api/organizations/${org.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          website: formData.website,
          timezone: formData.timezone,
          logoUrl: formData.logoUrl || null,
          logoShape: formData.logoShape,
          publicKnowledgeBase: formData.publicKnowledgeBase,
        }),
      })

      if (res.ok) {
        router.refresh()
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } else {
        const data = await res.json()
        setError(data.error || 'Erro ao salvar')
      }
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    try {
      const uploadData = new FormData()
      uploadData.append('file', file)
      uploadData.append('projectId', 'org-logo')

      const res = await fetch('/api/storage/upload', { method: 'POST', body: uploadData })
      if (res.ok) {
        const data = await res.json()
        setFormData(prev => ({ ...prev, logoUrl: data.publicUrl }))
      }
    } catch {
      setError('Erro ao fazer upload do logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const removeLogo = () => {
    setFormData(prev => ({ ...prev, logoUrl: '' }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Logo */}
      <div className="space-y-2">
        <Label className="text-xs dark:text-zinc-400 text-zinc-600">Logo da Organização</Label>
        <div className="flex items-center gap-4">
          {formData.logoUrl ? (
            <div className="relative">
              <img src={formData.logoUrl} alt="Logo" className="w-12 h-12 rounded-lg object-cover dark:border-zinc-700 border-zinc-300" />
              <button
                type="button"
                onClick={removeLogo}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"
              >
                <X className="w-2.5 h-2.5 text-white" />
              </button>
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg border border-dashed dark:border-zinc-700 border-zinc-300 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 dark:text-zinc-600 text-zinc-400" />
            </div>
          )}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploadingLogo}
              className="h-7 text-xs"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadingLogo ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5 mr-1" />
              )}
              {uploadingLogo ? 'Enviando...' : formData.logoUrl ? 'Trocar logo' : 'Enviar logo'}
            </Button>
            <p className="text-[10px] dark:text-zinc-600 text-zinc-400 mt-1">PNG, JPG até 2MB</p>
          </div>
        </div>
        {/* Logo shape */}
        {formData.logoUrl && (
          <div className="flex items-center gap-4 mt-3">
            <p className="text-xs dark:text-zinc-500 text-zinc-500">Formato do logo:</p>
            <div className="flex items-center gap-3">
              {[
                { value: 'square', label: 'Quadrado' },
                { value: 'horizontal', label: 'Horizontal' },
              ].map(opt => (
                <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="logoShape"
                    value={opt.value}
                    checked={formData.logoShape === opt.value}
                    onChange={() => setFormData(prev => ({ ...prev, logoShape: opt.value }))}
                    className="accent-violet-500"
                  />
                  <span className="text-xs dark:text-zinc-400 text-zinc-600">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="name" className="text-xs dark:text-zinc-400 text-zinc-600">Nome da Organização</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="h-8 text-sm"
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="slug" className="text-xs dark:text-zinc-400 text-zinc-600">Slug</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
            className="h-8 text-sm font-mono"
            required
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="description" className="text-xs dark:text-zinc-400 text-zinc-600">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descreva sua organização..."
          rows={3}
          className="text-sm resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="website" className="text-xs dark:text-zinc-400 text-zinc-600">Website</Label>
          <Input
            id="website"
            type="url"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://exemplo.com"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="timezone" className="text-xs dark:text-zinc-400 text-zinc-600">Fuso Horário</Label>
          <Select
            value={formData.timezone}
            onValueChange={(value) => setFormData({ ...formData, timezone: value })}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timezones.map((tz) => (
                <SelectItem key={tz.value} value={tz.value} className="text-sm">{tz.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border-t dark:border-zinc-800/40 border-zinc-200 pt-4 space-y-3">
        <h3 className="text-sm font-medium dark:text-zinc-300 text-zinc-700">Público</h3>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="publicKB"
            checked={formData.publicKnowledgeBase}
            onChange={(e) => setFormData(prev => ({ ...prev, publicKnowledgeBase: e.target.checked }))}
            className="w-4 h-4 rounded dark:bg-zinc-800 bg-zinc-100 dark:border-zinc-700 border-zinc-300 text-brand focus:ring-brand"
          />
          <Label htmlFor="publicKB" className="text-sm dark:text-zinc-300 text-zinc-700 cursor-pointer">
            Base de Conhecimento pública
          </Label>
        </div>
        {formData.publicKnowledgeBase && (
          <p className="text-[11px] dark:text-zinc-600 text-zinc-500">
            Link público: <code className="dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-400 text-zinc-600 px-1.5 py-0.5 rounded">/public/knowledge/{formData.slug}</code>
          </p>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
      {saved && (
        <p className="text-xs text-emerald-400 flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5" />
          Salvo com sucesso!
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t dark:border-zinc-800/60 border-zinc-200">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? (
            <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Salvando...</>
          ) : (
            'Salvar'
          )}
        </Button>
      </div>
    </form>
  )
}
