import { z } from 'zod'

export const createTimeEntrySchema = z.object({
  taskId: z.string().cuid(),
  minutes: z.number().int().min(1).max(1440),
  description: z.string().min(1).max(2000),
})

export const timeEntryFilterSchema = z.object({
  taskId: z.string().optional(),
  projectId: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>
export type TimeEntryFilter = z.infer<typeof timeEntryFilterSchema>