'use client'

import { useState, useEffect, useRef } from 'react'
import { Sparkles, Loader2, AlertTriangle, Download } from 'lucide-react'

function parseInsight(text: string): React.ReactNode {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let inList = false
  let listItems: React.ReactNode[] = []

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-2 text-zinc-400">
          {listItems}
        </ul>
      )
      listItems = []
      inList = false
    }
  }

  lines.forEach((line, i) => {
    const trimmed = line.trim()

    if (!trimmed) {
      flushList()
      elements.push(<div key={`br-${i}`} className="h-2" />)
      return
    }

    // Headers (## or #)
    if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      flushList()
      const level = trimmed.startsWith('##') ? 'h3' : 'h2'
      const content = trimmed.replace(/^#+\s*/, '')
      elements.push(
        <h3
          key={`h-${i}`}
          className={`font-semibold text-zinc-200 mt-4 mb-2 ${level === 'h2' ? 'text-base' : 'text-sm'}`}
        >
          {content}
        </h3>
      )
      return
    }

    // Bold text
    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      flushList()
      const content = trimmed.replace(/\*\*/g, '')
      elements.push(
        <p key={`b-${i}`} className="font-medium text-zinc-300 my-1">
          {content}
        </p>
      )
      return
    }

    // List items
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true
      const content = trimmed.slice(2)
      // Handle bold within list items
      const parts = content.split(/\*\*(.+?)\*\*/)
      listItems.push(
        <li key={`li-${i}`} className="text-sm leading-relaxed">
          {parts.length > 1
            ? parts.map((part, j) =>
                j % 2 === 1 ? (
                  <strong key={j} className="font-medium text-zinc-300">
                    {part}
                  </strong>
                ) : (
                  part
                )
              )
            : content}
        </li>
      )
      return
    }

    // Regular paragraph
    flushList()
    const parts = trimmed.split(/\*\*(.+?)\*\*/)
    elements.push(
      <p key={`p-${i}`} className="text-sm text-zinc-400 leading-relaxed my-1">
        {parts.length > 1
          ? parts.map((part, j) =>
              j % 2 === 1 ? (
                <strong key={j} className="font-medium text-zinc-300">
                  {part}
                </strong>
              ) : (
                part
              )
            )
          : trimmed}
      </p>
    )
  })

  flushList()
  return <>{elements}</>
}

export default function InsightsClient({ projectId }: { projectId: string }) {
  const [insight, setInsight] = useState('')
  const [loading, setLoading] = useState(true)
  const printableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/projects/${projectId}/insights`)
      .then(r => r.json())
      .then(data => { setInsight(data.insight); setLoading(false) })
      .catch(() => setLoading(false))
  }, [projectId])

  const handleDownloadPDF = () => {
    const content = printableRef.current
    if (!content) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Insights do Projeto</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; color: #1a1a1a; max-width: 800px; margin: 0 auto; }
          h1 { font-size: 20px; color: #111; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
          h2 { font-size: 16px; color: #111; margin-top: 24px; margin-bottom: 8px; }
          h3 { font-size: 14px; color: #111; margin-top: 20px; margin-bottom: 8px; }
          p { font-size: 13px; line-height: 1.6; color: #374151; margin: 8px 0; }
          ul { padding-left: 20px; }
          li { font-size: 13px; line-height: 1.6; color: #374151; margin: 4px 0; }
          strong { color: #111; }
          .footer { margin-top: 40px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>Insights da IA - Projeto</h1>
        <div>${content.innerHTML}</div>
        <div class="footer">Gerado em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
      </body>
      </html>
    `)
    printWindow.document.close()
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }

  if (loading) {
    return (
      <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-8 text-center">
        <Loader2 className="w-6 h-6 text-brand mx-auto mb-3 animate-spin" />
        <p className="text-sm text-zinc-500">Analisando dados do projeto com IA...</p>
      </div>
    )
  }

  if (!insight) {
    return (
      <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-8 text-center">
        <AlertTriangle className="w-6 h-6 text-zinc-700 mx-auto mb-3" />
        <p className="text-sm text-zinc-600">Não foi possível gerar insights</p>
      </div>
    )
  }

  return (
    <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg">
      <div className="px-4 py-3 border-b border-zinc-800/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand" />
          <h3 className="text-sm font-medium text-zinc-200">Insights da IA</h3>
        </div>
        <button
          onClick={handleDownloadPDF}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1 rounded hover:bg-zinc-800/40"
          title="Baixar em PDF"
        >
          <Download className="w-3.5 h-3.5" />
          PDF
        </button>
      </div>

      {/* Hidden printable content */}
      <div className="hidden" ref={printableRef}>
        {parseInsight(insight)}
      </div>

      {/* Visible formatted content */}
      <div className="p-6">
        {parseInsight(insight)}
      </div>
    </div>
  )
}
