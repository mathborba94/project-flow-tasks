import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import prisma from '@/lib/prisma'

const STATUS_MAP: Record<string, string> = {
  'A Fazer': 'TODO',
  'Em Progresso': 'IN_PROGRESS',
  'Em Revisão': 'IN_REVIEW',
  'Concluído': 'DONE',
  'Cancelado': 'CANCELLED',
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  IN_REVIEW: 'IN_REVIEW',
  DONE: 'DONE',
  CANCELLED: 'CANCELLED',
}

const PRIORITY_MAP: Record<string, string> = {
  'Baixa': 'LOW',
  'Média': 'MEDIUM',
  'Alta': 'HIGH',
  'Urgente': 'URGENT',
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let current = ''
  let inQuotes = false
  let row: string[] = []

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (char === '"' && next === '"') {
        current += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        row.push(current.trim())
        current = ''
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && next === '\n') i++
        row.push(current.trim())
        if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
          rows.push(row)
        }
        row = []
        current = ''
      } else {
        current += char
      }
    }
  }

  row.push(current.trim())
  if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
    rows.push(row)
  }

  return rows
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
    })
    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 400 })
    }

    const text = await file.text()
    const rows = parseCSV(text)

    if (rows.length < 2) {
      return NextResponse.json({ error: 'CSV vazio ou sem dados' }, { status: 400 })
    }

    // First row is header, skip it
    const dataRows = rows.slice(1)

    // Get task types for this org
    const taskTypes = await prisma.taskType.findMany({
      where: { organizationId },
    })
    const taskTypeMap = new Map(taskTypes.map(tt => [tt.name.toLowerCase(), tt.id]))

    // Get users for assignee lookup
    const users = await prisma.user.findMany({
      where: { organizationId },
    })
    const userMap = new Map(users.map(u => [u.email.toLowerCase(), u.id]))

    const created: any[] = []
    const errors: any[] = []

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      if (row.length < 2) continue

      const [titleRaw, descRaw, statusRaw, priorityRaw, emailRaw, typeRaw, dueDateRaw] = row

      const title = titleRaw.replace(/^"|"$/g, '').trim()
      if (!title) continue

      const description = descRaw.replace(/^"|"$/g, '').trim()
      const status = STATUS_MAP[statusRaw] || 'TODO'
      const priority = PRIORITY_MAP[priorityRaw] || 'MEDIUM'
      const email = emailRaw.toLowerCase()
      const assignedToId = userMap.get(email) || null
      const taskTypeId = typeRaw ? taskTypeMap.get(typeRaw.toLowerCase()) || null : null

      let dueDate: Date | null = null
      if (dueDateRaw) {
        const parsed = new Date(dueDateRaw)
        if (!isNaN(parsed.getTime())) {
          dueDate = parsed
        }
      }

      try {
        const task = await prisma.task.create({
          data: {
            organizationId,
            title,
            description: description || null,
            projectId: id,
            status: status as any,
            priority: priority as any,
            assignedToId,
            taskTypeId,
            dueDate,
          },
        })
        created.push(task)
      } catch (e: any) {
        errors.push({ row: i + 2, title, error: e.message })
      }
    }

    return NextResponse.json({ created: created.length, errors, tasks: created }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
  }
}
