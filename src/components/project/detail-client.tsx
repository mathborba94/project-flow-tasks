'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Settings, ExternalLink } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import KanbanBoard from '@/components/project/kanban'
import ProjectActions from '@/components/project/actions'
import CommentsClient from '@/components/project/comments'
import InsightsClient from '@/components/project/insights'
import DocumentsClient from '@/components/project/documents'
import MembersClient from '@/components/project/members'
import SettingsModal from '@/components/project/settings-modal'
import CsvImportExport from '@/components/project/csv-import-export'

interface ProjectDetailClientProps {
  projectId: string
  projectData: {
    id: string
    name: string
    description: string | null
    color: string
    status: string
    type: string
    budget: any
    hourlyRate: any
    startDate: Date | string | null
    endDate: Date | string | null
    targetEndDate: Date | string | null
    archived: boolean
    totalHours: number
    totalCost: number
    completionStageId: string | null
    allowPublicTasks: boolean
  }
  status: { label: string; className: string }
  typeLabels: Record<string, string>
  progress: number
  serializedTasks: any[]
  serializedStages: any[]
  orgMembers: any[]
  showSettings: boolean
  showProgress: boolean
  canEdit: boolean
  taskTypes: any[]
  defaultTaskTypeId: string | null
  isViewer: boolean
}

export default function ProjectDetailClient({
  projectId,
  projectData: projectDataProp,
  status,
  typeLabels,
  progress,
  serializedTasks,
  serializedStages,
  orgMembers,
  showSettings,
  showProgress,
  canEdit,
  taskTypes,
  defaultTaskTypeId,
  isViewer,
}: ProjectDetailClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('kanban')
  const [settingsOpen, setSettingsOpen] = useState(showSettings)
  const [projectData, setProjectData] = useState(projectDataProp)

  useEffect(() => {
    const view = searchParams.get('view')
    setSettingsOpen(view === 'settings')
  }, [searchParams])

  const handleSettingsClose = (open: boolean) => {
    if (!open) {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('view')
      const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
      router.replace(newUrl, { scroll: false })
      setSettingsOpen(false)
    }
  }

  const handleOpenSettings = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', 'settings')
    router.replace(`?${params.toString()}`, { scroll: false })
    setSettingsOpen(true)
  }

  const handleSettingsSave = (updated: Record<string, unknown>) => {
    setProjectData(prev => ({ ...prev, ...updated }))
  }

  return (
    <div className="flex flex-col h-full md:h-screen bg-[#09090b]">
      {/* Top bar */}
      <div className="flex-shrink-0 border-b border-zinc-800/60 bg-[#09090b]">
        <div className="px-3 md:px-4 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Link href="/dashboard/projects" className="text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full flex-shrink-0" style={{ backgroundColor: projectData.color || '#5c6ac4' }} />
              <h1 className="text-xs md:text-sm font-semibold text-zinc-100 truncate">{projectData.name}</h1>
              <span className={`hidden md:inline text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${status.className}`}>
                {status.label}
              </span>
              <span className="text-[10px] text-zinc-600 bg-zinc-800/60 px-2 py-0.5 rounded-full">
                {typeLabels[projectData.type] || 'Escopo Fechado'}
              </span>
              {projectData.archived && (
                <span className="text-[10px] text-zinc-600 bg-zinc-800/60 px-2 py-0.5 rounded-full">
                  Arquivado
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <div className="hidden md:flex items-center gap-4 text-xs text-zinc-500">
              {showProgress && (
                <span className="tabular-nums">{progress}% progresso</span>
              )}
              <span className="tabular-nums">{Math.round(projectData.totalHours || 0)}h</span>
              {projectData.type === 'SCOPE_FIXED' && (
                <span className="tabular-nums">R$ {Math.round(projectData.totalCost || 0).toLocaleString('pt-BR')}</span>
              )}
            </div>

            <div className="flex items-center gap-0.5 md:gap-1">
              {!isViewer && (
                <>
                  <ProjectActions projectId={projectId} archived={projectData.archived} />
                  <Link
                    href={`/public/projects/${projectId}/new-task`}
                    target="_blank"
                    className="p-1 md:p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors rounded flex items-center gap-1"
                    title="Formulário público de tarefas"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={handleOpenSettings}
                    className="p-1 md:p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors rounded"
                    title="Configurações"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 border-t border-zinc-800/40">
          <div className="px-3 md:px-4 overflow-x-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-transparent border-0 p-0 gap-0 h-9 min-w-max">
                <TabsTrigger
                  value="kanban"
                  className="rounded-none border-b-2 border-transparent data-active:border-zinc-400 data-active:bg-transparent data-active:text-zinc-200 text-zinc-500 text-xs md:text-sm px-2 md:px-3"
                >
                  Kanban
                </TabsTrigger>
                <TabsTrigger
                  value="documents"
                  className="rounded-none border-b-2 border-transparent data-active:border-zinc-400 data-active:bg-transparent data-active:text-zinc-200 text-zinc-500 text-xs md:text-sm px-2 md:px-3"
                >
                  Documentos
                </TabsTrigger>
                <TabsTrigger
                  value="comments"
                  className="rounded-none border-b-2 border-transparent data-active:border-zinc-400 data-active:bg-transparent data-active:text-zinc-200 text-zinc-500 text-xs md:text-sm px-2 md:px-3"
                >
                  Comentários
                </TabsTrigger>
                <TabsTrigger
                  value="members"
                  className="rounded-none border-b-2 border-transparent data-active:border-zinc-400 data-active:bg-transparent data-active:text-zinc-200 text-zinc-500 text-xs md:text-sm px-2 md:px-3"
                >
                  Membros
                </TabsTrigger>
                <TabsTrigger
                  value="insights"
                  className="rounded-none border-b-2 border-transparent data-active:border-zinc-400 data-active:bg-transparent data-active:text-zinc-200 text-zinc-500 text-xs md:text-sm px-2 md:px-3"
                >
                  Insights
                </TabsTrigger>
                <TabsTrigger
                  value="import"
                  className="rounded-none border-b-2 border-transparent data-active:border-zinc-400 data-active:bg-transparent data-active:text-zinc-200 text-zinc-500 text-xs md:text-sm px-2 md:px-3"
                >
                  Importar/Exportar
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="kanban" className="h-full">
            <div className="h-full px-4 pt-4 pb-2">
              <KanbanBoard
                projectId={projectId}
                tasks={serializedTasks}
                stages={serializedStages}
                canEdit={canEdit && !projectData.archived}
                members={orgMembers}
                completionStageId={projectData.completionStageId}
                allowPublicTasks={projectData.allowPublicTasks}
                taskTypes={taskTypes}
                defaultTaskTypeId={defaultTaskTypeId}
              />
            </div>
          </TabsContent>
          <TabsContent value="documents" className="h-full overflow-y-auto p-4">
            <DocumentsClient projectId={projectId} />
          </TabsContent>
          <TabsContent value="comments" className="h-full overflow-y-auto p-4">
            <CommentsClient projectId={projectId} />
          </TabsContent>
          <TabsContent value="members" className="h-full overflow-y-auto p-4">
            <MembersClient projectId={projectId} />
          </TabsContent>
          <TabsContent value="insights" className="h-full overflow-y-auto p-4">
            <InsightsClient projectId={projectId} />
          </TabsContent>
          <TabsContent value="import" className="h-full overflow-y-auto p-4">
            <CsvImportExport projectId={projectId} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        open={settingsOpen}
        onOpenChange={handleSettingsClose}
        project={projectData}
        stages={serializedStages}
        onSave={handleSettingsSave}
      />
    </div>
  )
}
