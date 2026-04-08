import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export type TaskHistoryEventType = 
  | 'CREATED' 
  | 'STAGE_CHANGED' 
  | 'STATUS_CHANGED' 
  | 'ASSIGNEE_CHANGED' 
  | 'COMPLETED' 
  | 'PRIORITY_CHANGED' 
  | 'TITLE_CHANGED' 
  | 'DESCRIPTION_CHANGED'

export async function createTaskHistory(
  taskId: string,
  eventType: TaskHistoryEventType,
  description: string,
  createdById: string | null,
  metadata?: Record<string, unknown>
) {
  return prisma.taskHistory.create({
    data: {
      taskId,
      eventType,
      description,
      createdById,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : null,
    },
    include: {
      createdBy: {
        select: { id: true, name: true },
      },
    },
  })
}

export async function getTaskHistory(taskId: string) {
  return prisma.taskHistory.findMany({
    where: { taskId },
    include: {
      createdBy: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })
}
