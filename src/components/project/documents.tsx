'use client'

import { useState, useEffect, useRef } from 'react'
import { FileText, Upload, Trash2, Plus, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Document {
  id: string
  name: string
  fileUrl: string
  type: string
  createdAt: string
}

export default function DocumentsClient({ projectId }: { projectId: string }) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [docType, setDocType] = useState('ATTACHMENT')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/projects/${projectId}/documents`)
      .then(r => r.json())
      .then(data => { setDocuments(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [projectId])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', projectId)

      const res = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao enviar')
      }

      const { publicUrl, name } = await res.json()

      const docRes = await fetch(`/api/projects/${projectId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, fileUrl: publicUrl, type: docType }),
      })

      if (docRes.ok) {
        const doc = await docRes.json()
        setDocuments(prev => [doc, ...prev])
        setShowForm(false)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      console.error('Erro ao fazer upload:', message)
      alert(`Erro ao enviar arquivo: ${message}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async (docId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/documents?documentId=${docId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== docId))
      }
    } catch {
      // silent
    }
  }

  const typeLabels: Record<string, string> = {
    SCOPE: 'Escopo',
    CONTRACT: 'Contrato',
    ATTACHMENT: 'Anexo',
    OTHER: 'Outro',
  }

  if (loading) {
    return (
      <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-8 text-center">
        <p className="text-sm text-zinc-600">Carregando documentos...</p>
      </div>
    )
  }

  return (
    <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg">
      <div className="px-4 py-3 border-b border-zinc-800/40 flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-200">Documentos</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowForm(!showForm)}
          className="text-zinc-400 hover:text-zinc-200 h-7 px-2"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        </Button>
      </div>

      {showForm && (
        <div className="p-4 border-b border-zinc-800/40 space-y-3">
          <div className="flex gap-2 items-center">
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="bg-zinc-900/60 border border-zinc-800 rounded-md px-2 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700"
            >
              <option value="SCOPE">Escopo</option>
              <option value="CONTRACT">Contrato</option>
              <option value="ATTACHMENT">Anexo</option>
              <option value="OTHER">Outro</option>
            </select>
          </div>

          <div
            className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center hover:border-zinc-600 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="*/*"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
                <p className="text-sm text-zinc-400">Enviando arquivo...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-5 h-5 text-zinc-500" />
                <p className="text-sm text-zinc-400">Clique para selecionar um arquivo</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="divide-y divide-zinc-800/40">
        {documents.length > 0 ? (
          documents.map((doc) => (
            <div key={doc.id} className="px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-zinc-800/60 rounded flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-zinc-500" />
              </div>
              <div className="flex-1 min-w-0">
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-zinc-200 hover:text-zinc-100 truncate block"
                >
                  {doc.name}
                </a>
                <span className="text-[11px] text-zinc-600">
                  {typeLabels[doc.type] || doc.type} • {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <button
                onClick={() => handleDelete(doc.id)}
                className="text-zinc-600 hover:text-red-400 transition-colors p-1"
                title="Remover documento"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        ) : (
          <div className="px-4 py-8 text-center text-xs text-zinc-600">
            Nenhum documento adicionado
          </div>
        )}
      </div>
    </div>
  )
}
