import { z } from 'zod'

export const createTimeEntrySchema = z.object({
  taskId: z.string().cuid(),
  minutes: z.number().int().min(1).max(1440),
  description: z.string().max(2000).optional(),
})

export const timeEntryFilterSchema = z.object({
  taskId: z.string().cuid().optional(),
  projectId: z.string().cuid().optional(),
  userId: z.string().cuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>
export type TimeEntryFilter = z.infer<typeof timeEntryFilterSchema>