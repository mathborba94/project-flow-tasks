'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, BookOpen, FolderOpen, Eye, Globe, Settings } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'

export default function KnowledgeManager({
  categories: initialCategories,
  articles: initialArticles,
  publicKnowledgeBase,
  orgSlug,
}: {
  categories: any[]
  articles: any[]
  publicKnowledgeBase: boolean
  orgSlug: string
}) {
  const [categories, setCategories] = useState(initialCategories)
  const [articles, setArticles] = useState(initialArticles)
  const [isPublic, setIsPublic] = useState(publicKnowledgeBase)

  // Category dialog
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [catName, setCatName] = useState('')
  const [catDesc, setCatDesc] = useState('')
  const [catColor, setCatColor] = useState('#6B7280')
  const [catPublic, setCatPublic] = useState(false)

  // Article dialog
  const [showArticleDialog, setShowArticleDialog] = useState(false)
  const [editingArticle, setEditingArticle] = useState<any>(null)
  const [artTitle, setArtTitle] = useState('')
  const [artContent, setArtContent] = useState('')
  const [artStatus, setArtStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT')
  const [artCategory, setArtCategory] = useState('')

  // View article
  const [viewingArticle, setViewingArticle] = useState<any>(null)

  const [saving, setSaving] = useState(false)

  const openNewCategory = () => {
    setEditingCategory(null)
    setCatName('')
    setCatDesc('')
    setCatColor('#6B7280')
    setCatPublic(false)
    setShowCategoryDialog(true)
  }

  const openEditCategory = (cat: any) => {
    setEditingCategory(cat)
    setCatName(cat.name)
    setCatDesc(cat.description || '')
    setCatColor(cat.color)
    setCatPublic(cat.includeInPublic)
    setShowCategoryDialog(true)
  }

  const saveCategory = async () => {
    if (!catName.trim()) return
    setSaving(true)
    try {
      if (editingCategory) {
        const res = await fetch(`/api/knowledge-categories?id=${editingCategory.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: catName,
            description: catDesc,
            color: catColor,
            includeInPublic: catPublic,
          }),
        })
        if (res.ok) {
          const updated = await res.json()
          setCategories(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c))
        }
      } else {
        const res = await fetch('/api/knowledge-categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: catName,
            description: catDesc,
            color: catColor,
            includeInPublic: catPublic,
          }),
        })
        if (res.ok) {
          const created = await res.json()
          setCategories(prev => [...prev, created])
        }
      }
      setShowCategoryDialog(false)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Excluir esta categoria?')) return
    try {
      const res = await fetch(`/api/knowledge-categories?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setCategories(prev => prev.filter(c => c.id !== id))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const openNewArticle = () => {
    setEditingArticle(null)
    setArtTitle('')
    setArtContent('')
    setArtStatus('DRAFT')
    setArtCategory('')
    setShowArticleDialog(true)
  }

  const openEditArticle = (article: any) => {
    setEditingArticle(article)
    setArtTitle(article.title)
    setArtContent(article.content)
    setArtStatus(article.status)
    setArtCategory(article.categoryId || '')
    setShowArticleDialog(true)
  }

  const saveArticle = async () => {
    if (!artTitle.trim()) return
    setSaving(true)
    try {
      if (editingArticle) {
        const res = await fetch(`/api/knowledge/${editingArticle.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: artTitle,
            content: artContent,
            status: artStatus,
            categoryId: artCategory || null,
          }),
        })
        if (res.ok) {
          const updated = await res.json()
          setArticles(prev => prev.map(a => a.id === updated.id ? { ...a, ...updated } : a))
        }
      } else {
        const res = await fetch('/api/knowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: artTitle,
            content: artContent,
            status: artStatus,
            categoryId: artCategory || null,
          }),
        })
        if (res.ok) {
          const created = await res.json()
          setArticles(prev => [...prev, created])
        }
      }
      setShowArticleDialog(false)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const deleteArticle = async (id: string) => {
    if (!confirm('Excluir este artigo?')) return
    try {
      const res = await fetch(`/api/knowledge/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setArticles(prev => prev.filter(a => a.id !== id))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const togglePublicKB = async () => {
    try {
      const res = await fetch('/api/organizations/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicKnowledgeBase: !isPublic }),
      })
      if (res.ok) {
        setIsPublic(!isPublic)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const statusConfig: Record<string, { label: string; color: string }> = {
    DRAFT: { label: 'Rascunho', color: 'bg-zinc-800 text-zinc-400' },
    PUBLISHED: { label: 'Publicado', color: 'bg-emerald-500/10 text-emerald-400' },
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-zinc-100 tracking-tight">Base de Conhecimento</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Gerencie categorias e artigos</p>
          </div>
          <div className="flex items-center gap-2">
            {isPublic && orgSlug && (
              <a
                href={`/public/knowledge/${orgSlug}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 border border-zinc-800 px-3 py-1.5 rounded-md hover:bg-zinc-900 transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                Ver público
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4 mb-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-zinc-500" />
            <div>
              <p className="text-sm text-zinc-300 font-medium">Base de Conhecimento Pública</p>
              <p className="text-xs text-zinc-500">Permitir acesso público aos artigos marcados como públicos</p>
            </div>
          </div>
          <button
            onClick={togglePublicKB}
            className={`relative w-10 h-5 rounded-full transition-colors ${isPublic ? 'bg-emerald-600' : 'bg-zinc-700'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Categories */}
        <div className="animate-fade-in-delay">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-zinc-500" />
              <h2 className="text-sm font-medium text-zinc-300">Categorias</h2>
            </div>
            <button
              onClick={openNewCategory}
              className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Nova
            </button>
          </div>
          <div className="space-y-2">
            {categories.map(cat => (
              <div key={cat.id} className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-3 hover:border-zinc-700/60 transition-colors group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <div>
                      <p className="text-xs font-medium text-zinc-300">{cat.name}</p>
                      <p className="text-[11px] text-zinc-500">{cat._count?.articles || 0} artigos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditCategory(cat)} className="p-1 text-zinc-600 hover:text-zinc-400">
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button onClick={() => deleteCategory(cat.id)} className="p-1 text-zinc-600 hover:text-red-400">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                {cat.description && (
                  <p className="text-[11px] text-zinc-500 mt-1">{cat.description}</p>
                )}
                {cat.includeInPublic && (
                  <Badge variant="outline" className="text-[10px] mt-1 bg-blue-500/10 text-blue-400 border-blue-500/20">
                    Pública
                  </Badge>
                )}
              </div>
            ))}
            {categories.length === 0 && (
              <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-6 text-center">
                <p className="text-xs text-zinc-500">Nenhuma categoria</p>
              </div>
            )}
          </div>
        </div>

        {/* Articles */}
        <div className="lg:col-span-2 animate-fade-in-delay-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-zinc-500" />
              <h2 className="text-sm font-medium text-zinc-300">Artigos</h2>
            </div>
            <button
              onClick={openNewArticle}
              className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo
            </button>
          </div>
          <div className="space-y-2">
            {articles.map(article => (
              <div key={article.id} className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-3 hover:border-zinc-700/60 transition-colors group">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <button
                        onClick={() => setViewingArticle(article)}
                        className="text-xs font-medium text-zinc-300 hover:text-zinc-100 transition-colors text-left"
                      >
                        {article.title}
                      </button>
                      <Badge variant="outline" className={`text-[10px] ${statusConfig[article.status]?.color || 'bg-zinc-800 text-zinc-400'}`}>
                        {statusConfig[article.status]?.label || article.status}
                      </Badge>
                    </div>
                    {article.category && (
                      <p className="text-[11px] text-zinc-500">
                        {article.category.name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                    <button onClick={() => openEditArticle(article)} className="p-1 text-zinc-600 hover:text-zinc-400">
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button onClick={() => deleteArticle(article.id)} className="p-1 text-zinc-600 hover:text-red-400">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {articles.length === 0 && (
              <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-6 text-center">
                <p className="text-xs text-zinc-500">Nenhum artigo</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nome</Label>
              <Input value={catName} onChange={e => setCatName(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Descrição</Label>
              <textarea
                value={catDesc}
                onChange={e => setCatDesc(e.target.value)}
                className="mt-1.5 w-full bg-zinc-900/60 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700 resize-none min-h-[60px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cor</Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <input type="color" value={catColor} onChange={e => setCatColor(e.target.value)} className="w-8 h-8 rounded border border-zinc-700" />
                  <span className="text-xs text-zinc-400">{catColor}</span>
                </div>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={catPublic}
                    onChange={e => setCatPublic(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-900"
                  />
                  Incluir na base pública
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>Cancelar</Button>
            <Button onClick={saveCategory} disabled={saving || !catName.trim()}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Article Dialog */}
      <Dialog open={showArticleDialog} onOpenChange={setShowArticleDialog}>
        <DialogContent className="!max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingArticle ? 'Editar Artigo' : 'Novo Artigo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Título</Label>
              <Input value={artTitle} onChange={e => setArtTitle(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Categoria</Label>
              <select
                value={artCategory}
                onChange={e => setArtCategory(e.target.value)}
                className="mt-1.5 w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700"
              >
                <option value="">Sem categoria</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Status</Label>
              <select
                value={artStatus}
                onChange={e => setArtStatus(e.target.value as 'DRAFT' | 'PUBLISHED')}
                className="mt-1.5 w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700"
              >
                <option value="DRAFT">Rascunho</option>
                <option value="PUBLISHED">Publicado</option>
              </select>
            </div>
            <div>
              <Label>Conteúdo</Label>
              <textarea
                value={artContent}
                onChange={e => setArtContent(e.target.value)}
                className="mt-1.5 w-full bg-zinc-900/60 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700 resize-none min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowArticleDialog(false)}>Cancelar</Button>
            <Button onClick={saveArticle} disabled={saving || !artTitle.trim()}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Article Dialog */}
      <Dialog open={!!viewingArticle} onOpenChange={() => setViewingArticle(null)}>
        <DialogContent className="!max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewingArticle?.title}</DialogTitle>
          </DialogHeader>
          <div className="py-2 max-h-[60vh] overflow-y-auto">
            {viewingArticle?.category && (
              <p className="text-xs text-zinc-500 mb-3">
                Categoria: {viewingArticle.category.name}
              </p>
            )}
            <div className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {viewingArticle?.content}
            </div>
            <p className="text-[11px] text-zinc-500 mt-4">
              Atualizado em {viewingArticle?.updatedAt ? new Date(viewingArticle.updatedAt).toLocaleDateString('pt-BR') : '-'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
