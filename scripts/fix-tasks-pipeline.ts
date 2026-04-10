/**
 * Script para atualizar pipelineStageId das tasks importadas do Pipefy.
 * Mapeia Task.status → PipelineStage.name automaticamente.
 *
 * Uso: npx tsx scripts/fix-tasks-pipeline.ts
 */

import prisma from '../src/lib/prisma'

const PROJECT_ID = 'cmnox0tlq0000klprsp20efof'

// Mapeamento de status para nome do stage no kanban (NOMES EXATOS DO PIPELINE)
const STATUS_TO_STAGE: Record<string, string> = {
  TODO: 'A Fazer',
  IN_PROGRESS: 'Em Progresso',
  IN_REVIEW: 'Em Revisao',
  DONE: 'Concluido',
  CANCELLED: 'Cancelado',
}

async function main() {
  console.log('🔍 Buscando projeto e pipeline stages...')

  const project = await prisma.project.findUnique({
    where: { id: PROJECT_ID },
    include: {
      pipeline: {
        include: {
          stages: {
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  })

  if (!project) {
    console.error('❌ Projeto não encontrado!')
    process.exit(1)
  }

  const stages = project.pipeline?.stages || []
  if (stages.length === 0) {
    console.error('❌ Projeto não possui pipeline stages!')
    process.exit(1)
  }

  console.log(`📋 Projeto: ${project.name}`)
  console.log(`📊 Pipeline: ${project.pipeline?.name}`)
  console.log('📌 Stages encontrados:')
  stages.forEach(s => console.log(`   - ${s.name} (order: ${s.order})`))

  // Cria mapa status → stageId
  const stageByName = new Map<string, string>()
  for (const stage of stages) {
    stageByName.set(stage.name.toLowerCase(), stage.id)
  }

  // Busca tasks do projeto sem pipelineStageId
  console.log('\n🔍 Buscando tasks sem pipelineStageId...')
  const tasks = await prisma.task.findMany({
    where: {
      projectId: PROJECT_ID,
      pipelineStageId: null,
    },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  console.log(`📦 ${tasks.length} tasks encontradas sem pipelineStageId`)

  if (tasks.length === 0) {
    console.log('✅ Nenhuma task para atualizar!')
    return
  }

  // Mostra distribuição de status
  const statusCount: Record<string, number> = {}
  tasks.forEach(t => {
    statusCount[t.status] = (statusCount[t.status] || 0) + 1
  })
  console.log('\n📊 Distribuição por status:')
  Object.entries(statusCount).forEach(([status, count]) => {
    const stage = STATUS_TO_STAGE[status]
    console.log(`   ${status} → ${stage}: ${count} tasks`)
  })

  // Atualiza tasks
  console.log('\n⚙️  Atualizando pipelineStageId...')
  let updated = 0
  let skipped = 0
  const errors: string[] = []

  for (const task of tasks) {
    const stageName = STATUS_TO_STAGE[task.status]
    if (!stageName) {
      skipped++
      errors.push(`Task "${task.title}" - status desconhecido: ${task.status}`)
      continue
    }

    const stageId = stageByName.get(stageName.toLowerCase())
    if (!stageId) {
      skipped++
      errors.push(`Task "${task.title}" - stage "${stageName}" não encontrado no pipeline`)
      continue
    }

    try {
      await prisma.task.update({
        where: { id: task.id },
        data: { pipelineStageId: stageId },
      })
      updated++
      console.log(`   ✅ "${task.title}" → ${stageName}`)
    } catch (e: any) {
      skipped++
      errors.push(`Task "${task.title}" - erro: ${e.message}`)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`✅ ${updated} tasks atualizadas`)
  console.log(`⚠️  ${skipped} tasks ignoradas`)

  if (errors.length > 0) {
    console.log('\n❌ Erros:')
    errors.forEach(e => console.log(`   - ${e}`))
  }
}

main()
  .catch(e => {
    console.error('Erro fatal:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
