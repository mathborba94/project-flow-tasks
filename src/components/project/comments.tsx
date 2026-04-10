'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, User } from 'lucide-react'

interface Comment {
  id: string
  content: string
  createdAt: string
  author: { id: string; name: string; email: string }
}

function CommentsClient({ projectId }: { projectId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetch(`/api/projects/${projectId}/comments`)
      .then(r => r.json())
      .then(data => { setComments(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [projectId])

  const handleSubmit = async () => {
    if (!newComment.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      })
      if (res.ok) {
        const comment = await res.json()
        setComments(prev => [comment, ...prev])
        setNewComment('')
      }
    } catch {
      // silent
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="dark:bg-zinc-950/50 bg-white border dark:border-zinc-800/60 border-zinc-200 rounded-lg">
      <div className="px-4 py-3 border-b dark:border-zinc-800/40 border-zinc-200">
        <h3 className="text-sm font-medium dark:text-zinc-200 text-zinc-800">Comentários</h3>
      </div>

      {/* Input */}
      <div className="p-4 border-b dark:border-zinc-800/40 border-zinc-200">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            placeholder="Escreva um comentário..."
            className="flex-1 dark:bg-zinc-900/60 bg-zinc-50 border dark:border-zinc-800 border-zinc-300 rounded-lg px-3 py-2 text-sm dark:text-zinc-200 text-zinc-800 dark:placeholder-zinc-600 placeholder-zinc-400 focus:outline-none focus:ring-1 dark:focus:ring-zinc-700 focus:ring-zinc-400 resize-none min-h-[60px]"
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || !newComment.trim()}
            className="self-end h-8 w-8 bg-white text-black rounded-lg flex items-center justify-center hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Comments list */}
      <div className="divide-y dark:divide-zinc-800/40 divide-zinc-200/50">
        {loading ? (
          <div className="px-4 py-8 text-center text-xs dark:text-zinc-600 text-zinc-400">Carregando...</div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 dark:bg-zinc-800 bg-zinc-100 rounded-full flex items-center justify-center">
                  <User className="w-3 h-3 dark:text-zinc-500 text-zinc-500" />
                </div>
                <span className="text-xs font-medium dark:text-zinc-300 text-zinc-300">{comment.author.name}</span>
                <span className="text-[11px] dark:text-zinc-600 text-zinc-400">
                  {new Date(comment.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm dark:text-zinc-400 text-zinc-400 whitespace-pre-wrap ml-7">{comment.content}</p>
            </div>
          ))
        ) : (
          <div className="px-4 py-8 text-center text-xs dark:text-zinc-600 text-zinc-400">Nenhum comentário ainda</div>
        )}
      </div>
    </div>
  )
}

export default CommentsClient
