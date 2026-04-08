'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import {
  BookOpen, FolderOpen, ArrowLeft, Search, Zap, Globe,
  ChevronRight, ExternalLink, FileText, X, Bot,
} from 'lucide-react'
import Link from 'next/link'

interface Article {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  category?: { id: string; name: string; color: string }
}

interface Category {
  id: string
  name: string
  color: string
  description: string | null
  articles: Article[]
}

interface PublicProject {
  id: string
  name: string
  description: string | null
  color: string
}

interface OrgData {
  organization: {
    name: string
    slug: string
    logoUrl: string | null
    description: string | null
    website: string | null
  }
  categories: Category[]
  uncategorized: Article[]
  publicProjects: PublicProject[]
  supportAgent: { name: string; shareToken: string } | null
}

export default function PublicKnowledgePage() {
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const [data, setData] = useState<OrgData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetch(`/api/public/knowledge?orgSlug=${orgSlug}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [orgSlug])

  const allArticles = useMemo(() => {
    if (!data) return []
    const fromCats = data.categories.flatMap(c =>
      c.articles.map(a => ({ ...a, category: { id: c.id, name: c.name, color: c.color } }))
    )
    return [...fromCats, ...data.uncategorized]
  }, [data])

  const searchResults = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return allArticles.filter(a =>
      a.title.toLowerCase().includes(q) || a.content?.toLowerCase().includes(q)
    )
  }, [query, allArticles])

  const filteredCategories = useMemo(() => {
    if (!data) return []
    return selectedCategory
      ? data.categories.filter(c => c.id === selectedCategory)
      : data.categories
  }, [data, selectedCategory])

  // ─── Loading ───
  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-800 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-xs text-zinc-600">Carregando...</p>
        </div>
      </div>
    )
  }

  // ─── Not found ───
  if (!data) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-5 h-5 text-zinc-600" />
          </div>
          <p className="text-sm font-medium text-zinc-400">Base de conhecimento não disponível</p>
          <p className="text-xs text-zinc-600 mt-1">Esta organização não publicou sua base de conhecimento.</p>
        </div>
      </div>
    )
  }

  // ─── Article view ───
  if (selectedArticle) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #0e0b1e 0%, #09090b 40%, #090e1b 100%)' }}>
        <header className="border-b border-zinc-800/40 bg-[#09090b]/60 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto px-6 h-14 flex items-center gap-3">
            <button
              onClick={() => setSelectedArticle(null)}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar
            </button>
            {selectedArticle.category && (
              <>
                <span className="text-zinc-700">/</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedArticle.category.color }} />
                  <span className="text-xs text-zinc-500">{selectedArticle.category.name}</span>
                </div>
              </>
            )}
          </div>
        </header>

        <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-10 text-white">
          <h1 className="text-2xl font-semibold text-zinc-100 mb-2">{selectedArticle.title}</h1>
          <p className="text-[11px] text-zinc-600 mb-8">
            Atualizado em{' '}
            {new Date(selectedArticle.updatedAt).toLocaleDateString('pt-BR', {
              day: '2-digit', month: 'long', year: 'numeric',
            })}
          </p>
          <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
            {selectedArticle.content}
          </div>
        </div>

        <PublicFooter org={data.organization} />
      </div>
    )
  }

  const totalArticles = allArticles.length

  // ─── Main view ───
  return (
    <div className="min-h-screen flex flex-col text-white" style={{ background: 'linear-gradient(160deg, #0e0b1e 0%, #09090b 45%, #090e1b 100%)' }}>

      {/* ─── HERO / SEARCH ─── */}
      <section className="relative overflow-hidden">
        {/* Gradient wash */}
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/30 via-violet-950/10 to-transparent pointer-events-none" />
        {/* Glow orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-10 left-1/4 w-[300px] h-[200px] bg-blue-600/8 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-10 right-1/4 w-[300px] h-[200px] bg-purple-600/8 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto px-6 pt-16 pb-14 text-center">
          {/* Org branding */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {data.organization.logoUrl ? (
              <img
                src={data.organization.logoUrl}
                alt={data.organization.name}
                className="w-10 h-10 rounded-xl object-cover border border-white/10"
              />
            ) : (
              <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <BookOpen className="w-5 h-5 text-violet-300" />
              </div>
            )}
            <span className="text-sm font-semibold text-zinc-200">{data.organization.name}</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
            <span className="bg-gradient-to-r from-violet-300 via-purple-200 to-blue-300 bg-clip-text text-transparent">
              Base de Conhecimento
            </span>
          </h1>

          {data.organization.description && (
            <p className="text-sm text-zinc-400 max-w-lg mx-auto mb-2 leading-relaxed">
              {data.organization.description}
            </p>
          )}
          <p className="text-xs text-zinc-600 mb-8">
            {totalArticles} {totalArticles === 1 ? 'artigo publicado' : 'artigos publicados'}
            {data.categories.length > 0 && ` · ${data.categories.length} ${data.categories.length === 1 ? 'categoria' : 'categorias'}`}
          </p>

          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar artigos..."
              className="w-full h-12 pl-11 pr-11 bg-white/5 border border-white/10 rounded-2xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/30 transition-all backdrop-blur-sm"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ─── CONTENT ─── */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">

        {/* Search results */}
        {query.trim() && (
          <div>
            <p className="text-xs text-zinc-500 mb-5">
              {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} para{' '}
              <span className="text-zinc-300">"{query}"</span>
            </p>
            {searchResults.length === 0 ? (
              <div className="text-center py-16">
                <Search className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">Nenhum artigo encontrado.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map(a => (
                  <ArticleCard key={a.id} article={a} onClick={() => setSelectedArticle(a)} />
                ))}
              </div>
            )}
          </div>
        )}

        {!query.trim() && (
          <>
            {/* Category pills */}
            {data.categories.length > 1 && (
              <div className="flex items-center gap-2 mb-8 flex-wrap">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`text-xs px-3.5 py-1.5 rounded-full transition-all border ${
                    !selectedCategory
                      ? 'bg-violet-500/15 text-violet-300 border-violet-500/30'
                      : 'bg-transparent text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  Todas
                </button>
                {data.categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                    className={`text-xs px-3.5 py-1.5 rounded-full transition-all border flex items-center gap-1.5 ${
                      selectedCategory === cat.id
                        ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                        : 'bg-transparent text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                    <span className="text-zinc-700 text-[10px]">{cat.articles.length}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Articles by category */}
            {filteredCategories.map(cat => (
              <div key={cat.id} className="mb-10">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <h2 className="text-sm font-semibold text-zinc-300">{cat.name}</h2>
                  {cat.description && <span className="text-xs text-zinc-600">— {cat.description}</span>}
                  <span className="ml-auto text-xs text-zinc-700">{cat.articles.length}</span>
                </div>
                {cat.articles.length === 0 ? (
                  <p className="text-xs text-zinc-700 py-3 pl-5">Nenhum artigo nesta categoria</p>
                ) : (
                  <div className="space-y-2">
                    {cat.articles.map(a => (
                      <ArticleCard
                        key={a.id}
                        article={{ ...a, category: { id: cat.id, name: cat.name, color: cat.color } }}
                        onClick={() => setSelectedArticle({ ...a, category: { id: cat.id, name: cat.name, color: cat.color } })}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Uncategorized */}
            {data.uncategorized.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-2.5 mb-4">
                  <FileText className="w-3.5 h-3.5 text-zinc-700" />
                  <h2 className="text-sm font-semibold text-zinc-300">Artigos</h2>
                  <span className="ml-auto text-xs text-zinc-700">{data.uncategorized.length}</span>
                </div>
                <div className="space-y-2">
                  {data.uncategorized.map(a => (
                    <ArticleCard key={a.id} article={a} onClick={() => setSelectedArticle(a)} />
                  ))}
                </div>
              </div>
            )}

            {filteredCategories.length === 0 && data.uncategorized.length === 0 && (
              <div className="text-center py-16">
                <BookOpen className="w-10 h-10 text-zinc-800 mx-auto mb-4" />
                <p className="text-sm text-zinc-500">Nenhum artigo publicado ainda.</p>
              </div>
            )}

            {/* ─── Public project links ─── */}
            {data.publicProjects.length > 0 && (
              <div className="mt-4 pt-10 border-t border-zinc-800/40">
                <div className="flex items-center gap-2.5 mb-5">
                  <FolderOpen className="w-4 h-4 text-zinc-500" />
                  <h2 className="text-sm font-semibold text-zinc-300">Formulários Públicos</h2>
                  <span className="text-xs text-zinc-600 ml-0.5">— envie uma solicitação para a equipe</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.publicProjects.map(project => (
                    <Link
                      key={project.id}
                      href={`/public/projects/${project.id}/new-task`}
                      className="group flex items-center gap-3 border border-zinc-800/60 rounded-xl p-4 hover:border-zinc-700/60 hover:bg-white/[0.02] transition-all"
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border"
                        style={{ backgroundColor: `${project.color}15`, borderColor: `${project.color}30` }}
                      >
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors truncate">
                          {project.name}
                        </p>
                        {project.description && (
                          <p className="text-xs text-zinc-600 truncate">{project.description}</p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-500 transition-colors flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <PublicFooter org={data.organization} />

      {/* ─── Floating support agent button ─── */}
      {data.supportAgent && (
        <a
          href={`/public/agent/${data.supportAgent.shareToken}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-full shadow-[0_8px_32px_rgba(124,58,237,0.5)] hover:shadow-[0_8px_40px_rgba(124,58,237,0.7)] transition-all hover:-translate-y-0.5"
        >
          <Bot className="w-4 h-4" />
          {data.supportAgent.name}
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </a>
      )}
    </div>
  )
}

// ─── Article Card ───
function ArticleCard({
  article,
  onClick,
}: {
  article: Article & { category?: { id: string; name: string; color: string } }
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left border border-zinc-800/60 rounded-xl p-4 hover:border-zinc-700/40 hover:bg-white/[0.02] transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors leading-snug">
            {article.title}
          </p>
          {article.content && (
            <p className="text-xs text-zinc-600 mt-1 line-clamp-1">
              {article.content.substring(0, 120)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {article.category && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: `${article.category.color}15`, color: article.category.color }}
            >
              {article.category.name}
            </span>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-500 transition-colors" />
        </div>
      </div>
    </button>
  )
}

// ─── Footer ───
function PublicFooter({
  org,
}: {
  org: { name: string; description?: string | null; website?: string | null }
}) {
  return (
    <footer className="border-t border-zinc-800/30 mt-auto">
      <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <p className="text-xs font-semibold text-zinc-400">{org.name}</p>
          {org.description && (
            <p className="text-[11px] text-zinc-600 mt-0.5 max-w-xs">{org.description}</p>
          )}
          {org.website && (
            <a
              href={org.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors mt-1"
            >
              <Globe className="w-3 h-3" />
              {org.website.replace(/^https?:\/\//, '')}
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-zinc-900 border border-zinc-800 rounded-sm flex items-center justify-center">
            <Zap className="w-2.5 h-2.5 text-violet-400" />
          </div>
          <p className="text-[11px] text-zinc-700">
            Powered by{' '}
            <Link href="/" className="text-zinc-500 hover:text-zinc-400 transition-colors font-medium">
              ProjectFlow
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
