import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import prisma from '@/lib/prisma'
import * as XLSX from 'xlsx'

// Mapeamento de fases do Pipefy para status do sistema
const STAGE_TO_STATUS: Record<string, string> = {
  'Concluídas': 'DONE',
  'Concluido': 'DONE',
  'Concluído': 'DONE',
  'Em andamento': 'IN_PROGRESS',
  'Em Andamento': 'IN_PROGRESS',
  'Homologação/Testes': 'IN_REVIEW',
  'Homologacao/Testes': 'IN_REVIEW',
  'Homologação': 'IN_REVIEW',
  'Homologacao': 'IN_REVIEW',
  'Análise e Levantamento': 'TODO',
  'Analise e Levantamento': 'TODO',
  'Fila de Execução': 'TODO',
  'Fila de Execucao': 'TODO',
  'Arquivadas': 'CANCELLED',
  'Arquivada': 'CANCELLED',
  'Cancelado': 'CANCELLED',
}

// Mapeamento de nome de usuário para ID
const USER_MAP: Record<string, string> = {
  'Felipe Falcao': 'cmnt1ktms000104i6mjip8p34',
  'Felipe Falcão': 'cmnt1ktms000104i6mjip8p34',
  'Matheus Borba': 'cmnpzldji000104i0m15efu4i',
}

/**
 * Converte data serial do Excel para JavaScript Date
 * O Excel armazena datas como número de dias desde 1900-01-01
 */
function excelDateToJSDate(serial: number | string): Date | null {
  if (!serial || typeof serial !== 'number') {
    // Tenta parsear como string de data
    if (typeof serial === 'string') {
      const parsed = new Date(serial)
      return isNaN(parsed.getTime()) ? null : parsed
    }
    return null
  }

  // Fórmula: (serial - 25569) * 86400 * 1000
  // 25569 é o número de dias entre 1900-01-01 e 1970-01-01
  const utcDays = serial - 25569
  const utcMs = utcDays * 86400 * 1000
  const date = new Date(utcMs)

  // Ajuste para o bug do Excel que trata 1900 como ano bissexto
  if (serial <= 60) {
    date.setDate(date.getDate() - 1)
  }

  return isNaN(date.getTime()) ? null : date
}

/**
 * Remove espaços extras e normaliza strings
 */
function normalize(str: string): string {
  return str?.toString().trim().replace(/\s+/g, ' ') || ''
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId, user } = await getCurrentUserWithOrg()
    const { id } = await params

    const project = await prisma.project.findFirst({
      where: { id, organizationId },
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
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
    }

    // Busca pipeline stages do projeto para mapear faseAtual → pipelineStageId
    const stages = project.pipeline?.stages || []
    const stageByName = new Map<string, string>()
    // Mapeamento de fases do Pipefy para nomes de stages no kanban
    const FASE_TO_STAGE: Record<string, string> = {
      'Concluídas': 'Concluído',
      'Concluido': 'Concluído',
      'Em andamento': 'Em Progresso',
      'Em Andamento': 'Em Progresso',
      'Homologação/Testes': 'Em Revisão',
      'Homologacao/Testes': 'Em Revisão',
      'Homologação': 'Em Revisão',
      'Homologacao': 'Em Revisão',
      'Análise e Levantamento': 'A Fazer',
      'Analise e Levantamento': 'A Fazer',
      'Fila de Execução': 'Backlog',
      'Fila de Execucao': 'Backlog',
      'Arquivadas': 'Cancelado',
      'Arquivada': 'Cancelado',
    }

    // Popula o mapa nome → ID
    for (const stage of stages) {
      stageByName.set(stage.name.toLowerCase(), stage.id)
    }

    // Função para encontrar stage pelo nome da fase do Pipefy
    const findStageForFase = (fase: string): string | null => {
      if (!fase) return null
      // Tenta mapear primeiro
      const mappedName = FASE_TO_STAGE[fase]
      if (mappedName) {
        const stageId = stageByName.get(mappedName.toLowerCase())
        if (stageId) return stageId
      }
      // Tenta direto pelo nome da fase
      const directStage = stageByName.get(fase.toLowerCase())
      if (directStage) return directStage
      // Fallback: tenta por similaridade parcial
      for (const [name, stageId] of stageByName) {
        if (fase.toLowerCase().includes(name) || name.includes(fase.toLowerCase())) {
          return stageId
        }
      }
      return null
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 400 })
    }

    // Verifica se é um arquivo XLSX válido
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { error: 'Formato inválido. Apenas arquivos Excel (.xlsx, .xls) são aceitos' },
        { status: 400 }
      )
    }

    // Converte File para Buffer e lê com XLSX
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false })

    // Pega a primeira sheet
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]

    // Converte para JSON com header na primeira linha
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: '' })

    if (rows.length < 2) {
      return NextResponse.json({ error: 'Arquivo vazio ou sem dados' }, { status: 400 })
    }

    // Header row
    const headers = rows[0].map((h: any) => normalize(h.toString()))

    // Encontra índices das colunas esperadas
    const colIndex = {
      codigo: headers.findIndex((h: string) => h.toLowerCase().includes('codigo') || h.toLowerCase().includes('código')),
      solicitante: headers.findIndex((h: string) => h.toLowerCase().includes('nome do solicitante')),
      titulo: headers.findIndex((h: string) => h.toLowerCase() === 'titulo' || h.toLowerCase() === 'título'),
      tipoSolicitacao: headers.findIndex((h: string) => h.toLowerCase().includes('tipo de solicit') || h.toLowerCase().includes('tipo de solicita')),
      criadoEm: headers.findIndex((h: string) => h.toLowerCase().includes('criado em')),
      faseAtual: headers.findIndex((h: string) => h.toLowerCase().includes('fase atual')),
      finalizadoEm: headers.findIndex((h: string) => h.toLowerCase().includes('finalizado em')),
      criador: headers.findIndex((h: string) => h.toLowerCase().includes('criador')),
      responsaveis: headers.findIndex((h: string) => h.toLowerCase().includes('responsaveis') || h.toLowerCase().includes('responsáveis')),
      ultimoComentario: headers.findIndex((h: string) => h.toLowerCase().includes('ultimo comentario') || h.toLowerCase().includes('último comentário')),
      horasPlanejadas: headers.findIndex((h: string) => h.toLowerCase().includes('horas planejadas')),
      anotacoes: headers.findIndex((h: string) => h.toLowerCase().includes('anotacoes') || h.toLowerCase().includes('anotações')),
      horasExecutadas: headers.findIndex((h: string) => h.toLowerCase().includes('horas executadas')),
      evidencias: headers.findIndex((h: string) => h.toLowerCase().includes('evidencias') || h.toLowerCase().includes('evidências')),
      projeto: headers.findIndex((h: string) => h.toLowerCase().includes('projeto')),
    }

    // Valida se encontrou pelo menos a coluna de título
    if (colIndex.titulo === -1) {
      return NextResponse.json(
        { error: 'Coluna "Título" não encontrada no arquivo Excel' },
        { status: 400 }
      )
    }

    // Busca TaskTypes para mapeamento
    const taskTypes = await prisma.taskType.findMany({
      where: { organizationId },
    })
    const taskTypeMap = new Map(taskTypes.map(tt => [tt.name.toLowerCase(), tt.id]))

    // Busca usuários existentes para complementar o mapeamento
    const users = await prisma.user.findMany({
      where: { organizationId },
    })
    const userByEmailMap = new Map(users.map(u => [u.email.toLowerCase(), u.id]))
    const userByNameMap = new Map(users.map(u => [u.name.toLowerCase(), u.id]))

    // Merge com USER_MAP hardcoded
    Object.entries(USER_MAP).forEach(([name, userId]) => {
      userByNameMap.set(name.toLowerCase(), userId)
    })

    const dataRows = rows.slice(1)
    const created: any[] = []
    const errors: any[] = []
    let timeEntriesCreated = 0

    // Processa cada linha
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      if (!row || row.length === 0) continue

      const getValue = (colIdx: number): string => {
        if (colIdx === -1 || colIdx >= row.length) return ''
        const val = row[colIdx]
        return val?.toString().trim() || ''
      }

      const getNumericValue = (colIdx: number): number | null => {
        if (colIdx === -1 || colIdx >= row.length) return null
        const val = row[colIdx]
        if (val === '' || val === null || val === undefined) return null
        const num = typeof val === 'number' ? val : parseFloat(val.toString())
        return isNaN(num) ? null : num
      }

      const getDateValue = (colIdx: number): Date | null => {
        if (colIdx === -1 || colIdx >= row.length) return null
        const val = row[colIdx]
        if (val === '' || val === null || val === undefined) return null

        // Se é número (serial do Excel)
        if (typeof val === 'number') {
          return excelDateToJSDate(val)
        }

        // Se é data JS (cellDates: true retornaria Date)
        if (val instanceof Date) {
          return isNaN(val.getTime()) ? null : val
        }

        // Tenta parsear como string
        const parsed = new Date(val.toString())
        return isNaN(parsed.getTime()) ? null : parsed
      }

      try {
        // Extrai valores das colunas
        const titulo = getValue(colIndex.titulo)
        if (!titulo) continue // Pula linhas sem título

        const solicitante = getValue(colIndex.solicitante)
        const tipoSolicitacao = getValue(colIndex.tipoSolicitacao)
        const criadoEm = getDateValue(colIndex.criadoEm)
        const faseAtual = getValue(colIndex.faseAtual)
        const finalizadoEm = getDateValue(colIndex.finalizadoEm)
        const responsaveis = getValue(colIndex.responsaveis)
        const anotacoes = getValue(colIndex.anotacoes)
        const horasPlanejadas = getNumericValue(colIndex.horasPlanejadas)
        const horasExecutadas = getNumericValue(colIndex.horasExecutadas)
        const evidencias = getValue(colIndex.evidencias)
        const projeto = getValue(colIndex.projeto)
        const ultimoComentario = getValue(colIndex.ultimoComentario)
        const codigo = getValue(colIndex.codigo)

        // Mapeia status baseado na fase
        const status = STAGE_TO_STATUS[faseAtual] || 'TODO'

        // Mapeia faseAtual para pipelineStageId
        const pipelineStageId = findStageForFase(faseAtual)

        // Mapeia responsável (pega o primeiro se houver múltiplos)
        let assignedToId: string | null = null
        if (responsaveis) {
          const responsaveisList = responsaveis.split(',').map(r => normalize(r))
          for (const nome of responsaveisList) {
            const userId = userByNameMap.get(nome.toLowerCase())
            if (userId) {
              assignedToId = userId
              break // Pega o primeiro responsável encontrado
            }
          }
        }

        // Mapeia TaskType
        let taskTypeId: string | null = null
        if (tipoSolicitacao) {
          taskTypeId = taskTypeMap.get(tipoSolicitacao.toLowerCase()) || null
        }

        // Preparar dados da tarefa
        const taskData: any = {
          organizationId,
          title: titulo,
          description: anotacoes || null,
          projectId: id,
          status,
          priority: 'MEDIUM',
          pipelineStageId,
          assignedToId,
          taskTypeId,
          requesterName: solicitante || null,
          createdAt: criadoEm || new Date(),
          completedAt: status === 'DONE' && finalizadoEm ? finalizadoEm : null,
        }

        // Adiciona metadata com informações extras do Pipefy
        const metadata: any = {}
        if (codigo) metadata.pipefyCodigo = codigo
        if (faseAtual) metadata.pipefyFaseAtual = faseAtual
        if (ultimoComentario) metadata.pipefyUltimoComentario = ultimoComentario
        if (evidencias) metadata.pipefyEvidencias = evidencias
        if (projeto) metadata.pipefyProjeto = projeto
        if (horasPlanejadas) metadata.horasPlanejadas = horasPlanejadas

        if (Object.keys(metadata).length > 0) {
          // Junta metadata com description se houver
          const metadataStr = Object.entries(metadata)
            .map(([k, v]) => `${k}: ${v}`)
            .join('\n')

          taskData.description = anotacoes
            ? `${anotacoes}\n\n---\n**Dados importados do Pipefy:**\n${metadataStr}`
            : `**Dados importados do Pipefy:**\n${metadataStr}`
        }

        // Cria a tarefa
        const task = await prisma.task.create({
          data: taskData,
        })

        // Cria TimeEntry se houver horas executadas
        if (horasExecutadas && horasExecutadas > 0 && assignedToId) {
          const minutes = Math.round(horasExecutadas * 60)

          // Busca hourlyCost do usuário
          const assigneeUser = users.find(u => u.id === assignedToId)
          const hourlyCost = Number(assigneeUser?.hourlyCost || 0)
          const costSnapshot = hourlyCost * (minutes / 60)

          await prisma.timeEntry.create({
            data: {
              organizationId,
              taskId: task.id,
              userId: assignedToId,
              projectId: id,
              minutes,
              costSnapshot,
              description: finalizadoEm
                ? `Horas importadas do Pipefy - Finalizado em ${finalizadoEm.toLocaleDateString('pt-BR')}`
                : 'Horas importadas do Pipefy',
              createdAt: finalizadoEm || criadoEm || new Date(),
            },
          })
          timeEntriesCreated++
        } else if (horasExecutadas && horasExecutadas > 0 && !assignedToId) {
          // Se há horas mas não tem responsável mapeado, registra erro
          errors.push({
            row: i + 2,
            title: titulo,
            error: `Horas executadas (${horasExecutadas}h) não registradas - responsável "${responsaveis}" não encontrado`,
          })
        }

        created.push({
          id: task.id,
          title: task.title,
          status: task.status,
          assignedToId: task.assignedToId,
          horasExecutadas,
          timeEntryCreated: !!(horasExecutadas && assignedToId),
        })
      } catch (e: any) {
        errors.push({ row: i + 2, title: row[colIndex.titulo] || 'Desconhecido', error: e.message })
      }
    }

    return NextResponse.json({
      created: created.length,
      timeEntriesCreated,
      errors,
      tasks: created,
    }, { status: 201 })

  } catch (error: any) {
    console.error('Erro na importação XLSX:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
