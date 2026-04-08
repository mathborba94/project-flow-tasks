'use client'

import { Archive, RotateCcw } from 'lucide-react'

export default function ArchiveButton({
  projectId,
  action,
  label,
  icon,
}: {
  projectId: string
  action: 'archive' | 'unarchive'
  label: string
  icon: React.ReactNode
}) {
  return (
    <button
      onClick={() => {
        fetch(`/api/projects/${projectId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        }).then(() => window.location.reload())
      }}
      className="inline-flex items-center gap-1.5 text-xs text-zinc-500 border border-zinc-800 px-3 py-1.5 rounded-md hover:bg-zinc-900 transition-colors"
    >
      {icon}
      {label}
    </button>
  )
}
