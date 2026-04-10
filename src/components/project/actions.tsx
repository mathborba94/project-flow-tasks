'use client'

import { Archive, RotateCcw } from 'lucide-react'

export default function ProjectActions({
  projectId,
  archived,
}: {
  projectId: string
  archived: boolean
}) {
  return (
    <div className="flex items-center gap-1">
      {!archived ? (
        <button
          onClick={() => {
            fetch(`/api/projects/${projectId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'archive' }),
            }).then(() => window.location.reload())
          }}
          className="p-1.5 text-zinc-600 dark:hover:text-zinc-300 hover:text-zinc-700 transition-colors rounded"
          title="Arquivar projeto"
        >
          <Archive className="w-3.5 h-3.5" />
        </button>
      ) : (
        <button
          onClick={() => {
            fetch(`/api/projects/${projectId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'unarchive' }),
            }).then(() => window.location.reload())
          }}
          className="p-1.5 text-zinc-600 dark:hover:text-zinc-300 hover:text-zinc-700 transition-colors rounded"
          title="Desarquivar"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
